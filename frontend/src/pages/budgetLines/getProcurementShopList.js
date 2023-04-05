import ApplicationContext from "../../applicationContext/ApplicationContext";
import { setProcurementShop } from "./createBudgetLineSlice";

export const getProcurementShopList = () => {
    return async (dispatch) => {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
        const endpoint = `/api/${api_version}/procurement-shops/`;
        const responseData = ApplicationContext.get().helpers().callBackend(endpoint, "get");
        dispatch(setProcurementShop(responseData));
    };
};
