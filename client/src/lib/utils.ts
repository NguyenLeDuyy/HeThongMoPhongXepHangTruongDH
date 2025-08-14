/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import authApiRequest from "@/apiRequests/auth"
import envConfig from "@/config"
import { DishStatus, OrderStatus, Role, TableStatus } from "@/constants/type"
import { EntityError } from "@/lib/http"
import { clsx, type ClassValue } from "clsx"
import { UseFormSetError } from "react-hook-form"
import { toast } from "sonner"
import { twMerge } from "tailwind-merge"
import jwt from "jsonwebtoken";
import { TokenPayload } from "@/types/jwt.types"
import guestApiRequest from "@/apiRequests/guest"
import { BookX, CookingPot, HandCoins, Loader, Truck } from "lucide-react"
import { format } from "date-fns"
import { io } from "socket.io-client"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const handleErrorApi = ({ error, setError, duration }: {
  error: any
  setError?: UseFormSetError<any>
  duration?: number
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        type: 'server',
        message: item.message
      })
    })
  } else {
    console.error('Error:', error);
    toast.error('Lỗi', {
      description: error.payload?.message || 'Đã xảy ra lỗi không xác định',
      duration: duration ?? 5000
    });
  }
}

/**
 * Xóa đi ký tự `/` đầu tiên của path
 */
export const normalizePath = (path: string) => {
  return path.startsWith('/') ? path.slice(1) : path
}

const isBrowser = typeof window !== 'undefined'

export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(number)
}

export const getVietnameseDishStatus = (status: (typeof DishStatus)[keyof typeof DishStatus]) => {
  switch (status) {
    case DishStatus.Available:
      return 'Có sẵn'
    case DishStatus.Unavailable:
      return 'Không có sẵn'
    default:
      return 'Ẩn'
  }
}

export const getVietnameseOrderStatus = (status: (typeof OrderStatus)[keyof typeof OrderStatus]) => {
  switch (status) {
    case OrderStatus.Delivered:
      return 'Đã phục vụ'
    case OrderStatus.Paid:
      return 'Đã thanh toán'
    case OrderStatus.Pending:
      return 'Chờ xử lý'
    case OrderStatus.Processing:
      return 'Đang nấu'
    default:
      return 'Từ chối'
  }
}

export const getVietnameseTableStatus = (status: (typeof TableStatus)[keyof typeof TableStatus]) => {
  switch (status) {
    case TableStatus.Available:
      return 'Có sẵn'
    case TableStatus.Reserved:
      return 'Đã đặt'
    default:
      return 'Ẩn'
  }
}

export const getTableLink = ({ token, tableNumber }: { token: string; tableNumber: number }) => {
  return envConfig.NEXT_PUBLIC_URL + '/tables/' + tableNumber + '?token=' + token
}

export const getAccessTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem('accessToken') : null

export const getRefreshTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem('refreshToken') : null


export const setAccessTokenToLocalStorage = (token: string) =>
  isBrowser && localStorage.setItem('accessToken', token)

export const setRefreshTokenToLocalStorage = (token: string) =>
  isBrowser && localStorage.setItem('refreshToken', token)

export const removeTokensFromLocalStorage = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export const decodeToken = (token: string) => {
  return jwt.decode(token) as TokenPayload
}

export const checkAndRefreshToken = async (param?: {
  onError?: () => void;
  onSuccess?: () => void;
  force?: boolean
}
) => {
  // Không nên đưa logic lấy access và refresh tokjen ra khỏi function `checkAndRefreshToken`
  // Vì để mỗi lần mà checkAndRefreshToken() đc gọi sẽ có 1 access và refresh token mới
  // Tránh hiện tượng bug nó lấy access và refresh token cũ ở lần đầu để gọi cho các lần tiếp theo
  const accessToken = getAccessTokenFromLocalStorage();
  const refreshToken = getRefreshTokenFromLocalStorage();
  // Nếu chưa đăng nhập cũng không cho chạy
  if (!accessToken || !refreshToken) return;
  const decodedAccessToken = decodeToken(accessToken)
  const decodedRefreshToken = decodeToken(refreshToken)
  // Thời đeierm hết hạn của token là tính theo epoch time (s)
  // Còn khi dùng cú pháp new Date().getTime() thì nó trả về epoch time (ms)
  const now = (new Date().getTime() / 1000) - 1;
  // Trường hợp refresh token đã hết hạn thì logout
  if (decodedRefreshToken.exp <= now) {
    // Xóa access token và refresh token khỏi localStorage
    console.log("Refresh token đã hết hạn, đăng xuất");
    removeTokensFromLocalStorage();
    // Xóa cookie phía client
    if (isBrowser) {
      await fetch("/api/auth/logout", { method: "POST" });
    }
    return param?.onError && param.onError();
  }
  // Trường hợp refresh token thì không xử lý nữa
  // Thì mình sẽ ktra còn 1/3 thời gian (3s) thì sẽ cho refresh token lại
  // Ví đụ aToken của chta có expired time là 10s
  // Thì tgian còn lại sẽ tính dựa trên công thức: decodedAccessToken.exp - now
  // Access token's Expired time base on công thức: decodedAccessToken.exp - decodedAccessToken.iat
  if (param?.force || (decodedAccessToken.exp - now <
    (decodedAccessToken.exp - decodedAccessToken.iat) / 3
  )) {
    // Goi API refresh token
    try {
      const role = decodedRefreshToken.role
      const res = role === Role.Guest
        ? await guestApiRequest.refreshToken()
        : await authApiRequest.refreshToken();
      setAccessTokenToLocalStorage(res.payload.data.accessToken);
      setRefreshTokenToLocalStorage(res.payload.data.refreshToken);
      param?.onSuccess && param.onSuccess()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      param?.onError && param.onError()
    }
  }
};


export function removeAccents(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export const simpleMatchText = (fullText: string, matchText: string) => {
  return removeAccents(fullText.toLowerCase()).includes(removeAccents(matchText.trim().toLowerCase()))
}

export const formatDateTimeToLocaleString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'HH:mm:ss dd/MM/yyyy')
}

export const formatDateTimeToTimeString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'HH:mm:ss')
}

export const generateSocketInstance = (accessToken: string) => {
  return io(envConfig.NEXT_PUBLIC_API_ENDPOINT, {
    auth: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const OrderStatusIcon = {
  [OrderStatus.Pending]: Loader,
  [OrderStatus.Processing]: CookingPot,
  [OrderStatus.Rejected]: BookX,
  [OrderStatus.Delivered]: Truck,
  [OrderStatus.Paid]: HandCoins
}
