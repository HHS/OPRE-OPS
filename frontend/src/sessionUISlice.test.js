import { describe, expect, it } from "vitest";
import sessionUIReducer, { setTrail, clearTrail } from "./sessionUISlice";
import { logout } from "./components/Auth/authSlice";

const initialState = {
    navContext: {
        trail: null
    }
};

describe("sessionUISlice", () => {
    it("returns the initial state", () => {
        expect(sessionUIReducer(undefined, { type: "@@INIT" })).toEqual(initialState);
    });

    it("setTrail stores the trail", () => {
        const trail = {
            targetPath: "/agreements/1",
            ancestors: [
                { label: "Portfolios", to: "/portfolios" },
                { label: "Portfolio A", to: "/portfolios/5" }
            ]
        };
        const state = sessionUIReducer(initialState, setTrail(trail));
        expect(state.navContext.trail).toEqual(trail);
    });

    it("setTrail overwrites a previously stored trail", () => {
        const first = { targetPath: "/cans/1", ancestors: [{ label: "CANs", to: "/cans" }] };
        const second = { targetPath: "/agreements/2", ancestors: [{ label: "Agreements", to: "/agreements" }] };
        let state = sessionUIReducer(initialState, setTrail(first));
        state = sessionUIReducer(state, setTrail(second));
        expect(state.navContext.trail).toEqual(second);
    });

    it("clearTrail resets the trail to null", () => {
        const populated = {
            navContext: { trail: { targetPath: "/cans/1", ancestors: [{ label: "CANs", to: "/cans" }] } }
        };
        const state = sessionUIReducer(populated, clearTrail());
        expect(state.navContext.trail).toBeNull();
    });

    it("resets to initial state on logout", () => {
        const populated = {
            navContext: { trail: { targetPath: "/cans/1", ancestors: [{ label: "CANs", to: "/cans" }] } }
        };
        const state = sessionUIReducer(populated, logout());
        expect(state).toEqual(initialState);
    });
});
