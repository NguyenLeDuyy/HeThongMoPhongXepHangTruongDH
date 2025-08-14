import http from "@/lib/http";
import { DashboardIndicatorQueryParamsType, DashboardIndicatorResType } from "@/schemaValidations/indicator.schema";
import queryString from "query-string";

const indicatorApiRequest = {
    getDashBoardIndicators: (queryParams: DashboardIndicatorQueryParamsType) => http.get<DashboardIndicatorResType>("/indicators/dashboard?" + queryString.stringify({
        fromDate: queryParams.fromDate,
        toDate: queryParams.toDate,
    })),
}

export default indicatorApiRequest;
