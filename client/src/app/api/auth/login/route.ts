import authApiRequest from "@/apiRequests/auth";
import { LoginBodyType } from "@/schemaValidations/auth.schema";
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken'
import { HttpError } from "@/lib/http";

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const body = (await request.json()) as LoginBodyType;
    try {
        const { payload } = await authApiRequest.sLogin(body);
        const { accessToken, refreshToken } = payload.data

        const decodedAccessToken = jwt.decode(accessToken) as { exp: number };
        const decodedRefreshToken = jwt.decode(refreshToken) as { exp: number };

        const isProd = process.env.NODE_ENV === 'production';

        const res = NextResponse.json(payload);
        res.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            path: '/',
            expires: new Date(decodedAccessToken.exp * 1000),
            secure: isProd,
            sameSite: 'lax'
        });
        res.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            path: '/',
            expires: new Date(decodedRefreshToken.exp * 1000),
            secure: isProd,
            sameSite: 'lax'
        });

        return res
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