"use client";
import { getTableLink } from "@/lib/utils";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";

type QRCodeTableProps = {
  // Original table props (backward compatible)
  token?: string;
  tableNumber?: number;
  // Generic QR value (preferred for arbitrary links)
  value?: string;
  // Canvas width
  width?: number;
  // Optional footer lines to render under the QR
  footerTexts?: string[];
};

export default function QRCodeTable({
  token,
  tableNumber,
  value,
  width = 250,
  footerTexts,
}: QRCodeTableProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // Determine the QR data and footer texts
    const data = value ?? (token && typeof tableNumber === "number"
      ? getTableLink({ token, tableNumber })
      : "");

    if (!data) return;

    const defaultFooter = token && typeof tableNumber === "number"
      ? ["Quán ăn Duy Lê", `Bàn số ${tableNumber}`, "Quét mã QR để gọi món"]
      : [];

    const lines = footerTexts ?? defaultFooter;

    const canvas = canvasRef.current!;
    const lineHeight = 22;
    const bottomBlockHeight = lines.length > 0 ? 15 + lines.length * lineHeight : 0;
    canvas.height = width + bottomBlockHeight;
    canvas.width = width;
    const ctx = canvas.getContext("2d")!;
    // background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // footer texts
    if (lines.length > 0) {
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#000";
      lines.forEach((text, idx) => {
        const y = width + 15 + idx * lineHeight;
        ctx.fillText(text, canvas.width / 2, y);
      });
    }

    // draw QR to a virtual canvas then paint onto real canvas
    const virtualCanvas = document.createElement("canvas");
    QRCode.toCanvas(
      virtualCanvas,
      data,
      {
        width,
        margin: 4,
      },
      function (error) {
        if (error) console.error(error);
        const dx = 0;
        const dy = 0;
        ctx.drawImage(virtualCanvas, dx, dy, width, width);
      }
    );
  }, [token, value, width, tableNumber, footerTexts]);
  return <canvas ref={canvasRef} />;
}
