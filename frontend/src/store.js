import { configureStore } from "@reduxjs/toolkit";
import canListSlice from "./pages/cans/list/canListSlice";
import canDetailSlice from "./pages/cans/detail/canDetailSlice";

export default configureStore({
    reducer: {
        canList: canListSlice,
        canDetail: canDetailSlice,
    },
});
