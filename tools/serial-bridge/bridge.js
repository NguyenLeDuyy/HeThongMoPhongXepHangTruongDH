require('dotenv').config();
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { io } = require('socket.io-client');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;

const API = process.env.API_URL || 'http://localhost:4000';
const QUEUE_ID = process.env.QUEUE_ID;
const COM = process.env.COM_PORT || 'COM2';
const BAUD = Number(process.env.BAUD_RATE || 9600);
const TOKEN = process.env.API_TOKEN || '';
const MODE = (process.env.PROTEUS_MODE || 'kiosk').toLowerCase(); // kiosk | staff
const SERVING_ADVANCE = (process.env.SERVING_ADVANCE || 'done').toLowerCase(); // done | skipped | none

if (!QUEUE_ID) {
    console.error('Missing QUEUE_ID in .env');
    process.exit(1);
}

const http = axios.create({
    baseURL: API,
    headers: {
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
        'Content-Type': 'application/json',
    },
    timeout: 5000,
});
axiosRetry(http, { retries: 5, retryDelay: axiosRetry.exponentialDelay });

let port, parser;
function openSerial() {
    if (port?.isOpen) return;
    console.log(`[serial] opening ${COM} @ ${BAUD}`);
    port = new SerialPort({ path: COM, baudRate: BAUD, autoOpen: true }, (e) => {
        if (e) console.error('[serial] open error:', e.message);
    });
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
    parser.on('data', onSerialLine);
    port.on('close', () => {
        console.warn('[serial] closed, retry in 2s');
        setTimeout(openSerial, 2000);
    });
    port.on('error', (e) => console.error('[serial] error:', e.message));
}
openSerial();

const socket = io(`${API}/public`, { reconnection: true, transports: ['websocket', 'polling'] });
let currentTicket = null; // vé đang phục vụ

// Khởi tạo currentTicket khi bridge vừa kết nối (nếu đã có vé đang phục vụ)
async function initCurrentTicket() {
    try {
        const res = await http.get(`/queues/${QUEUE_ID}`);
        const data = res?.data?.payload?.data || res?.data?.data || res?.data || {};
        const tickets = data.tickets || [];
        const serving = tickets.find((t) => t.status === 'serving');
        currentTicket = serving || null;
        if (serving) {
            const num = String(serving.number ?? 0).padStart(4, '0');
            port?.write(`D,${num}\n`);
            console.log('[init] detected serving ticket', num);
        }
    } catch (_) {
        // ignore
    }
}

socket.on('connect', () => {
    console.log('[socket] connected');
    socket.emit('join-queue', QUEUE_ID);
    initCurrentTicket();
});
socket.on('reconnect', () => socket.emit('join-queue', QUEUE_ID));
socket.on('connect_error', (e) => console.error('[socket] connect_error:', e.message));
socket.on('ticket-called', (ticket) => {
    const num = String(ticket?.number ?? 0).padStart(4, '0');
    console.log('[socket] ticket-called', num);
    currentTicket = ticket || null;
    port?.write(`D,${num}\n`);
});
socket.on('ticket-updated', (ticket) => {
    // Nếu vé hiện tại đã được cập nhật trạng thái sang done/skipped thì clear
    if (currentTicket?.id && ticket?.id === currentTicket.id && (ticket.status === 'done' || ticket.status === 'skipped')) {
        currentTicket = null;
    }
});
socket.on('queue-reset', () => {
    console.log('[socket] queue-reset');
    currentTicket = null;
    port?.write('D,0000\n');
});

let lastN = 0;
async function markCurrent(status, reason = 'Proteus auto-advance') {
    if (!currentTicket?.id) return;
    try {
        await http.put(`/tickets/${currentTicket.id}/status`, { status, reason });
        console.log(`[http] current ticket -> ${status}`);
        currentTicket = null;
    } catch (e) {
        if (e.response) {
            console.error('[http] update status failed', e.response.status, e.response.data);
        } else {
            console.error('[http] update status failed', e.message);
        }
    }
}

async function callNext() {
    try {
        await http.post(`/queues/${QUEUE_ID}/call-next`, {});
        console.log('[http] call-next OK');
    } catch (e) {
        if (e.response) {
            console.error('[http] call-next failed', e.response.status, e.response.data);
        } else {
            console.error('[http] call-next failed', e.message);
        }
    }
}

async function onSerialLine(line) {
    const msg = line.trim();
    const now = Date.now();
    if (msg === 'N') {
        if (now - lastN < 400) return; // debounce 400ms
        lastN = now;
        if (MODE === 'staff') {
            console.log('[serial] N (staff mode)');
            // Nếu đang có vé phục vụ, xử lý tự động theo cấu hình rồi mới gọi số tiếp theo
            if (currentTicket?.id && SERVING_ADVANCE !== 'none') {
                await markCurrent(SERVING_ADVANCE, 'Proteus auto-advance');
            }
            await callNext();
        } else {
            console.log('[serial] N (kiosk mode) -> create ticket');
            try {
                await http.post(`/queues/${QUEUE_ID}/tickets`, {
                    studentName: 'Kiosk',
                    mssv: `${Date.now()}`,
                });
            } catch (e) {
                if (e.response) {
                    console.error('[http] create ticket failed', e.response.status, e.response.data);
                } else {
                    console.error('[http] create ticket failed', e.message);
                }
            }
        }
        return;
    }
    if (msg === 'C') {
        console.log('[serial] C -> call next');
        try {
            await http.post(`/queues/${QUEUE_ID}/call-next`, {});
        } catch (e) {
            if (e.response) {
                console.error('[http] call-next failed', e.response.status, e.response.data);
            } else {
                console.error('[http] call-next failed', e.message);
            }
        }
        return;
    }
    console.log('[serial] ignore:', msg);
}

process.on('SIGINT', () => { try { port?.close(); } catch { } process.exit(0); });
