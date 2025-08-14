import orderApiRequest from "@/apiRequests/order"
import { GetOrdersQueryParamsType, PayGuestOrdersBodyType, UpdateOrderBodyType } from "@/schemaValidations/order.schema"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useUpdateOrderMutation = () => {
    return useMutation({
        mutationFn: ({
            orderId,
            ...body
        }: UpdateOrderBodyType & {
            orderId: number
        }) => orderApiRequest.updateOrder(orderId, body),
    })
}

export const useGetOrderListQuery = (queryParams: GetOrdersQueryParamsType) => {
    return useQuery({
        queryKey: ['orders', queryParams],
        queryFn: () => orderApiRequest.getOrderList(queryParams)
    })
}

export const useGetOrderDetailQuery = ({
    id, enabled
}: {
    id: number,
    enabled: boolean
}) => {
    return useQuery({
        queryKey: ['orders', id],
        enabled,
        queryFn: () => orderApiRequest.getOrderDetail(id)
    })
}

export const usePayForGuestMutation = () => {
    return useMutation({
        mutationFn: (body: PayGuestOrdersBodyType) => orderApiRequest.pay(body)
    })
}

export const useCreateOrderMutation = () => {
    return useMutation({
        mutationFn: orderApiRequest.createOrder
    })
}