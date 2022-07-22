import { configureStore } from "@reduxjs/toolkit";
import canListSlice from "./pages/cans/list/canListSlice";

export default configureStore({
    reducer: {
        canList: canListSlice,
    },
});
