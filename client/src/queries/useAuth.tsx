import authApiRequest from "@/apiRequests/auth"
import { useMutation } from "@tanstack/react-query"

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (body: LoginBodyType) => authApiRequest.login(body) // dùng login (Next API)
  })
}


export const useLogoutMutation = () => {
    return useMutation({
        mutationFn: authApiRequest.logout,
    })
}