import ApplicationContext from "../../../applicationContext/ApplicationContext";
import { isRequired } from "../../../utils";

export const getResearchProject = async (id = isRequired("id is required")) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/research-projects/${id}`, "get");
    return responseData;
};
