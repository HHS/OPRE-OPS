import ApplicationContext from "../applicationContext/ApplicationContext";

export const getCanFiscalYearByCan = async (can_id, fiscal_year) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/can-fiscal-year/?can_id=${can_id}&year=${fiscal_year}`, "get");

    return responseData;
};
