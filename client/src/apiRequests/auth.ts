import http from '@/lib/http'
import {
  LoginBodyType,
  LoginResType,
  LogoutBodyType,
  RefreshTokenBodyType,
  RefreshTokenResType
} from '@/schemaValidations/auth.schema'
import { MessageResType } from '@/schemaValidations/common.schema'

const authApiRequest = {
  // Client -> Next API
  login: (body: LoginBodyType) =>
    http.post<LoginResType>('/api/auth/login', body, { baseUrl: '' }),
  logout: () =>
    http.post<MessageResType>('/api/auth/logout', null, { baseUrl: '' }),

  // Next API (server) -> Backend Fastify
  sLogin: (body: LoginBodyType) => http.post<LoginResType>('/auth/login', body),
  sLogout: (body: LogoutBodyType) => http.post<MessageResType>('/auth/logout', body),
  sRefreshToken: (body: RefreshTokenBodyType) => http.post<RefreshTokenResType>('/auth/refresh-token', body)
}

export default authApiRequest