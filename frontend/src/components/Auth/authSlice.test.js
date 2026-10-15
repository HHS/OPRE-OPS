import { beforeEach, describe, expect, it } from "vitest";
import {
    getVisitClassification,
    hasVisitClassification,
    setVisitClassification
} from "../../helpers/visitSessionCache.helpers";
import authReducer, { logout } from "./authSlice";

describe("authSlice logout", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("invalidates the cached welcome-message classification for the user who logged out", () => {
        setVisitClassification(42, false);

        const state = {
            isLoggedIn: true,
            loginError: { hasError: false, loginErrorType: null },
            activeUser: { id: 42, first_name: "Jordan" }
        };
        authReducer(state, logout());

        expect(hasVisitClassification(42)).toBe(false);
        expect(getVisitClassification(42)).toBeUndefined();
    });

    it("does not throw when logging out with no active user", () => {
        const state = {
            isLoggedIn: false,
            loginError: { hasError: false, loginErrorType: null },
            activeUser: null
        };

        expect(() => authReducer(state, logout())).not.toThrow();
    });

    it("clears activeUser and isLoggedIn", () => {
        const state = {
            isLoggedIn: true,
            loginError: { hasError: false, loginErrorType: null },
            activeUser: { id: 42, first_name: "Jordan" }
        };
        const next = authReducer(state, logout());

        expect(next.isLoggedIn).toBe(false);
        expect(next.activeUser).toBeNull();
    });
});
