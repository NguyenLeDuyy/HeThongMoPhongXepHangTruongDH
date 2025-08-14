import authApiRequest from "@/apiRequests/auth";
import { LoginBodyType } from "@/schemaValidations/auth.schema";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken'
import { HttpError } from "@/lib/http";

export async function POST(request: Request) {
    const body = (await request.json()) as LoginBodyType;
    // Sửa lỗi: Bỏ `await` vì cookies() là hàm đồng bộ
    const cookieStore = await cookies()
    try {
        const { payload } = await authApiRequest.sLogin(body);
        const { accessToken, refreshToken } = payload.data

        const decodedAccessToken = jwt.decode(accessToken) as { exp: number };
        const decodedRefreshToken = jwt.decode(refreshToken) as { exp: number };

        cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            path: '/',
            expires: decodedAccessToken.exp * 1000, // Dùng new Date() để rõ ràng hơn
            secure: true,
            sameSite: 'lax'
        })
        cookieStore.set('refreshToken', refreshToken, {
            httpOnly: true,
            path: '/',
            expires: decodedRefreshToken.exp * 1000,
            secure: true,
            sameSite: 'lax'
        })

        return Response.json(payload)
    } catch (error) {
        if (error instanceof HttpError) {
            return Response.json(error.payload, {
                status: error.status
            })
        } else {
            return Response.json({
                message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.',
            }, {
                status: 500
            })
        }
    }
}