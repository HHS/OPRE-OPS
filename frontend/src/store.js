import { combineReducers, configureStore } from "@reduxjs/toolkit";
import canDetailSlice from "./pages/cans/detail/canDetailSlice";
import portfolioListSlice from "./pages/portfolios/list/portfolioListSlice";
import authSlice from "./components/Auth/authSlice";
import userSlice from "./pages/users/detail/userSlice";
import userEditSlice from "./pages/users/edit/userSlice";
import researchProjectSlice from "./pages/researchProjects/detail/researchProjectSlice";
import alertSlice from "./components/UI/Alert/alertSlice";
import { opsApi } from "./api/opsAPI";
import { errorMiddleware } from "./errorMiddleware.js";
import { opsAuthApi } from "./api/opsAuthAPI.js";

const rootReducer = combineReducers({
    [opsApi.reducerPath]: opsApi.reducer,
    [opsAuthApi.reducerPath]: opsAuthApi.reducer,
    canDetail: canDetailSlice,
    portfolioList: portfolioListSlice,
    auth: authSlice,
    userDetail: userSlice,
    userDetailEdit: userEditSlice,
    researchProject: researchProjectSlice,
    alert: alertSlice
});

export const setupStore = (preloadedState = {}) => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(opsApi.middleware, opsAuthApi.middleware, errorMiddleware),
        preloadedState
    });
};

export default configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(opsApi.middleware, opsAuthApi.middleware, errorMiddleware)
});
