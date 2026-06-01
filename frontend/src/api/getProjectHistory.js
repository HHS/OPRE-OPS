import ApplicationContext from "../applicationContext/ApplicationContext";

/**
 * Fetch a page of Project history items.
 *
 * @param {number} id - The project id.
 * @param {number} page - 1-indexed page number.
 * @returns {Promise<{items: Array<Object>, count: number, limit: number, offset: number}>}
 */
export const getProjectHistoryByIdAndPage = async (id, page) => {
    const pageSize = 20;
    const limit = pageSize;
    const offset = pageSize * (page - 1);
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const endpoint = `/api/${api_version}/projects/${id}/history/?limit=${limit}&offset=${offset}`;
    const responseData = await ApplicationContext.get().helpers().callBackend(endpoint, "get");
    return {
        items: responseData?.data ?? [],
        count: responseData?.count ?? 0,
        limit: responseData?.limit ?? limit,
        offset: responseData?.offset ?? offset
    };
};
