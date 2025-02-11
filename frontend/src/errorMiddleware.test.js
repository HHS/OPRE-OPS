import { errorMiddleware } from "./errorMiddleware.js";
import { opsApi } from "./api/opsAPI.js";
import { logout } from "./components/Auth/authSlice.js";
import store from "./store.js";

describe("errorMiddleware", () => {
    it("should dispatch resetApiState and logout when action is rejected and status is 401", () => {
        const next = vi.fn();
        const action = { type: "REJECTED", payload: { status: 401 } };
        const dispatch = vi.spyOn(store, "dispatch");

        errorMiddleware(opsApi)(next)(action);

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(opsApi.util.resetApiState());
        expect(dispatch).toHaveBeenCalledWith(logout());
    });

    it("should not dispatch resetApiState and logout when action is rejected but status is not 401", () => {
        const next = vi.fn();
        const action = { type: "REJECTED", payload: { status: 500 } };
        const dispatch = vi.spyOn(store, "dispatch");

        errorMiddleware(opsApi)(next)(action);

        expect(dispatch).not.toHaveBeenCalled();
    });

    it("should not dispatch resetApiState and logout when action is not rejected", () => {
        const next = vi.fn();
        const action = { type: "FULFILLED" };
        const dispatch = vi.spyOn(store, "dispatch");

        errorMiddleware(opsApi)(next)(action);

        expect(dispatch).not.toHaveBeenCalled();
    });
});
