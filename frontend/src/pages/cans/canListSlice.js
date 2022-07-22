import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cans: [],
};

const canListSlice = createSlice({
    name: "canList",
    initialState,
    reducers: {
        setCanList: (state, action) => {
            state.cans = action.payload;
        },
    },
});

export const { setCanList } = canListSlice.actions;

export default canListSlice.reducer;
