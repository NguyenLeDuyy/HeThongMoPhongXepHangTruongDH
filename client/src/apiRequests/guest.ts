import http from "@/lib/http";
import { LogoutBodyType, RefreshTokenBodyType, RefreshTokenResType } from "@/schemaValidations/auth.schema";
import { GuestCreateOrdersBodyType, GuestCreateOrdersResType, GuestGetOrdersResType, GuestLoginBodyType, GuestLoginResType } from "@/schemaValidations/guest.schema";

const guestApiRequest = {
    sLogin: (body: GuestLoginBodyType) => http.post<GuestLoginResType>('/guest/auth/login', body),
    login: (body: GuestLoginBodyType) => http.post<GuestLoginResType>('/api/guest/auth/login', body, {
        baseUrl: ''
    }),
    sLogout: (body: LogoutBodyType & {
        accessToken: string;
    }) => http.post('/guest/auth/logout', {
        refreshToken: body.refreshToken
    },
        {
            headers: {
                Authorization: `Bearer ${body.accessToken}`
            }
        }
    ),
    logout: () => http.post('/api/guest/auth/logout', null, {
        baseUrl: ''
    }),  // client gọi đến route handler, không cần truyền accessToken và RefreshToken vì AT và RT tự động gửi thông qua cookie rồi
    sRefreshToken: (body: RefreshTokenBodyType) => http.post<RefreshTokenResType>('/guest/auth/refresh-token', body),
    refreshToken: () => http.post<RefreshTokenResType>('/api/guest/auth/refresh-token', null, {
        baseUrl: ''
    }),
    order: (body: GuestCreateOrdersBodyType) => http.post<GuestCreateOrdersResType>('/guest/orders', body),
    getOrderList: () => http.get<GuestGetOrdersResType>('/guest/orders')
}

export default guestApiRequest;