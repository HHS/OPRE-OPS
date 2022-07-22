import { configureStore } from "@reduxjs/toolkit";
import canListSlice from "./pages/cans/canListSlice";

export default configureStore({
    reducer: {
        canList: canListSlice,
    },
});
