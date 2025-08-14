import { Role } from '@/constants/type'
import { NextResponse, NextRequest } from 'next/server'
import jwt from "jsonwebtoken";
import { TokenPayload } from '@/types/jwt.types';

const managePaths = ['/manage',]
const guestPaths = ['/guest',]
const privatePaths = [...managePaths, ...guestPaths]
const unAuthPaths = ['/login',]
const onlyOwnerPaths = ['/manage/accounts']

const decodeToken = (token: string) => {
    return jwt.decode(token) as TokenPayload
}

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const accessToken = request.cookies.get('accessToken')?.value
    const refreshToken = request.cookies.get('refreshToken')?.value

    // Bypass API và static assets
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }


    // 1. Chưa đăng nhập thì không cho vào private Paths
    if (privatePaths.some(path => pathname.startsWith(path) && !refreshToken)) {
        const url = new URL('/login', request.url)
        url.searchParams.set('clearTokens', 'true')
        return NextResponse.redirect(url)
    }

    // 2. Trường hợp đã đăng nhập
    if (refreshToken) {
        // 2.1 Nếu cố tình truy cập vào login thì chuyển về trang chủ
        if (unAuthPaths.some(path => pathname.startsWith(path))) {
            return NextResponse.redirect(new URL('/', request.url))
        }

        // 2.2 Nhưng access token lại hết hạn
        if (privatePaths.some(path => pathname.startsWith(path) && !accessToken)) {
            const url = new URL('/refresh-token', request.url)
            url.searchParams.set('refreshToken', refreshToken ?? '')
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }

        // 2.3 Vào không đúng role, redirect về trang chủ
        const role = decodeToken(refreshToken)?.role
        // Guest nhưng cố tình vào route owner
        const issGuestGoToManagePath = role === Role.Guest && managePaths.some(path => pathname.startsWith(path))
        // Hoặc vào route guest nhưng không phải guest
        const isNotGuestGoToGuestPath = role !== Role.Guest && guestPaths.some(path => pathname.startsWith(path))
        // Không phải owner nhưng cố tình vào route owner
        const isNotOwnerGoToOwnerPath = role !== Role.Owner && onlyOwnerPaths.some((path) => pathname.startsWith(path))
        if (issGuestGoToManagePath || isNotGuestGoToGuestPath || isNotOwnerGoToOwnerPath) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }


    return NextResponse.next()
}

export const config = {
    matcher: ['/manage/:path*', '/guest/:path*', '/login',],
}