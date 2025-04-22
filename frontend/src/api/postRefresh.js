import ApplicationContext from "../applicationContext/ApplicationContext";
import store from "../store";
import {logout} from "../components/Auth/authSlice.js";

export const postRefresh = async () => {
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend("/auth/refresh/", "POST", {}, null, true)
        .then(function (response) {
            return response;
        }).catch(function () {
            store.dispatch(logout());
            window.location.href = "/login";
        });

    return responseData;
};
