import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logout, setUserDetails } from "../../components/Auth/authSlice";
import { setupStore } from "../../store";
import useWelcomeMessage from "./useWelcomeMessage";

const storage = new Map();

function wrapperForStore(store) {
    return function Wrapper({ children }) {
        return (
            <Provider store={store}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );
    };
}

function makeWrapper(activeUser) {
    const store = setupStore({ auth: { activeUser, isLoggedIn: !!activeUser } });
    return wrapperForStore(store);
}

describe("useWelcomeMessage", () => {
    beforeEach(() => {
        storage.clear();
        vi.clearAllMocks();
        localStorage.getItem.mockImplementation((key) => storage.get(key) ?? null);
        localStorage.setItem.mockImplementation((key, value) => storage.set(key, String(value)));
        localStorage.removeItem.mockImplementation((key) => storage.delete(key));
        localStorage.clear.mockImplementation(() => storage.clear());
    });

    afterEach(() => {
        storage.clear();
    });

    it("returns generic 'Welcome' when activeUser is null", () => {
        const { result } = renderHook(() => useWelcomeMessage(), { wrapper: makeWrapper(null) });

        expect(result.current.greeting).toBe("Welcome");
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it("returns 'Welcome [name]' and writes localStorage on first visit", () => {
        const { result } = renderHook(() => useWelcomeMessage(), {
            wrapper: makeWrapper({ id: 42, first_name: "Jordan" })
        });

        expect(result.current.greeting).toBe("Welcome Jordan");
        expect(localStorage.setItem).toHaveBeenCalledWith("hasVisited_42", "true");
    });

    it("first-visit greeting stays 'Welcome' even under Strict Mode double-invocation", () => {
        // reactStrictMode replays the mount effect (setup → cleanup → setup) like dev
        // StrictMode. Without the useRef guard the second setup reads the marker the
        // first wrote and flips the greeting to "Welcome back". A plain rerender() does
        // NOT reproduce this because the effect dependency is unchanged.
        const { result } = renderHook(() => useWelcomeMessage(), {
            wrapper: makeWrapper({ id: 42, first_name: "Jordan" }),
            reactStrictMode: true
        });

        expect(result.current.greeting).toBe("Welcome Jordan");
    });

    it("returns 'Welcome back [name]' when localStorage key already exists", () => {
        storage.set("hasVisited_42", "true");

        const { result } = renderHook(() => useWelcomeMessage(), {
            wrapper: makeWrapper({ id: 42, first_name: "Jordan" })
        });

        expect(result.current.greeting).toBe("Welcome back Jordan");
    });

    it("returns generic 'Welcome' fallback when first_name is null on first visit", () => {
        const { result } = renderHook(() => useWelcomeMessage(), {
            wrapper: makeWrapper({ id: 42, first_name: null })
        });

        expect(result.current.greeting).toBe("Welcome");
    });

    it("returns generic 'Welcome back' fallback when first_name is null on return visit", () => {
        storage.set("hasVisited_42", "true");

        const { result } = renderHook(() => useWelcomeMessage(), {
            wrapper: makeWrapper({ id: 42, first_name: null })
        });

        expect(result.current.greeting).toBe("Welcome back");
    });

    it("resets to generic 'Welcome' when the user logs out", () => {
        storage.set("hasVisited_42", "true");
        const store = setupStore({ auth: { activeUser: { id: 42, first_name: "Jordan" }, isLoggedIn: true } });

        const { result } = renderHook(() => useWelcomeMessage(), { wrapper: wrapperForStore(store) });
        expect(result.current.greeting).toBe("Welcome back Jordan");

        act(() => {
            store.dispatch(logout());
        });

        // No active user → no stale "Welcome back" leaking to a logged-out visitor.
        expect(result.current.greeting).toBe("Welcome");
    });

    it("classifies each user independently when switching accounts without a reload", () => {
        storage.set("hasVisited_7", "true"); // user 7 has visited before; user 9 has not
        const store = setupStore({ auth: { activeUser: { id: 7, first_name: "Robin" }, isLoggedIn: true } });

        const { result } = renderHook(() => useWelcomeMessage(), { wrapper: wrapperForStore(store) });
        expect(result.current.greeting).toBe("Welcome back Robin");

        act(() => {
            store.dispatch(setUserDetails({ id: 9, first_name: "Sam" }));
        });

        // New user id re-runs the effect against their own marker — first visit for user 9.
        expect(result.current.greeting).toBe("Welcome Sam");
        expect(storage.get("hasVisited_9")).toBe("true");
    });
});
