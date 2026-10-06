import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logout, setUserDetails } from "../../components/Auth/authSlice";
import { __resetVisitSessionCache } from "../../helpers/visitSessionCache.helpers";
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
        // The hook caches its first/returning classification at module scope so it survives
        // a real unmount+remount within one session; tests reuse user ids across cases, so
        // reset it here to keep cases independent of each other.
        __resetVisitSessionCache();
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
        // StrictMode. Without the session cache the second setup would re-read the marker
        // the first setup just wrote and flip the greeting to "Welcome back".
        const { result } = renderHook(() => useWelcomeMessage(), {
            wrapper: makeWrapper({ id: 42, first_name: "Jordan" }),
            reactStrictMode: true
        });

        expect(result.current.greeting).toBe("Welcome Jordan");
    });

    it("stays 'Welcome' across an unmount + remount within the same session", () => {
        // Simulates navigating from "/" to a sibling route (e.g. /release-notes) and back —
        // the index route element unmounts and a brand-new instance mounts on return. A
        // component-local useRef/useState would reset and misclassify this as a return visit;
        // the module-level session cache must keep the classification stable.
        const store = setupStore({ auth: { activeUser: { id: 42, first_name: "Jordan" }, isLoggedIn: true } });

        const { result: firstResult, unmount } = renderHook(() => useWelcomeMessage(), {
            wrapper: wrapperForStore(store)
        });
        expect(firstResult.current.greeting).toBe("Welcome Jordan");
        unmount();

        const { result: secondResult } = renderHook(() => useWelcomeMessage(), { wrapper: wrapperForStore(store) });
        expect(secondResult.current.greeting).toBe("Welcome Jordan");
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

    it("shows 'Welcome back' on a same-tab relogin, even though the first-ever visit was cached as 'first visit'", () => {
        // Regression test: logout() must invalidate the session cache entry for the user
        // who logged out. Without that, a same-tab relogin (no page reload — e.g. the
        // FakeAuth flow) would reuse the stale "first visit" classification cached during
        // this very first login, instead of re-reading localStorage (which the first login
        // already marked "true") and correctly showing "Welcome back".
        const store = setupStore({ auth: { activeUser: { id: 42, first_name: "Jordan" }, isLoggedIn: true } });

        const { result } = renderHook(() => useWelcomeMessage(), { wrapper: wrapperForStore(store) });
        expect(result.current.greeting).toBe("Welcome Jordan");
        expect(storage.get("hasVisited_42")).toBe("true");

        act(() => {
            store.dispatch(logout());
        });
        expect(result.current.greeting).toBe("Welcome");

        act(() => {
            store.dispatch(setUserDetails({ id: 42, first_name: "Jordan" }));
        });
        expect(result.current.greeting).toBe("Welcome back Jordan");
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

    it("treats a user id of 0 as a real logged-in user, not logged-out", () => {
        const { result } = renderHook(() => useWelcomeMessage(), {
            wrapper: makeWrapper({ id: 0, first_name: "Zero" })
        });

        expect(result.current.greeting).toBe("Welcome Zero");
        expect(localStorage.setItem).toHaveBeenCalledWith("hasVisited_0", "true");
    });
});
