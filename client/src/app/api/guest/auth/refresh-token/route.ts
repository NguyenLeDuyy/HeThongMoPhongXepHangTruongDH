import { cookies } from "next/headers";
import jwt from 'jsonwebtoken'
import { HttpError } from "@/lib/http";
import guestApiRequest from "@/apiRequests/guest";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: Request) {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (!refreshToken) {
        return Response.json({
            message: 'Không tìm thấy refresh token. Vui lòng đăng nhập lại.',
        }, {
            status: 401
        })
    }
    try {

        const { payload } = await guestApiRequest.sRefreshToken({ refreshToken });

        const decodedAccessToken = jwt.decode(payload.data.accessToken) as { exp: number };
        const decodedRefreshToken = jwt.decode(payload.data.refreshToken) as { exp: number };

        cookieStore.set('accessToken', payload.data.accessToken, {
            httpOnly: true,
            path: '/',
            expires: decodedAccessToken.exp * 1000, // Dùng new Date() để rõ ràng hơn
            secure: true,
            sameSite: 'lax'
        })
        cookieStore.set('refreshToken', payload.data.refreshToken, {
            httpOnly: true,
            path: '/',
            expires: decodedRefreshToken.exp * 1000,
            secure: true,
            sameSite: 'lax'
        })

        return Response.json(payload)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.log(error)
        if (error instanceof HttpError) {
            return Response.json(error.payload, {
                status: error.status
            })
        } else {
            return Response.json({
                message: error.message ?? 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.',
            }, {
                status: 401
            })
        }
    }
}