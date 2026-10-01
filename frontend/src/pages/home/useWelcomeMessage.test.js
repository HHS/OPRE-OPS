import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupStore } from "../../store";
import useWelcomeMessage from "./useWelcomeMessage";

const storage = new Map();

function makeWrapper(activeUser) {
    const store = setupStore({ auth: { activeUser, isLoggedIn: !!activeUser } });
    return function Wrapper({ children }) {
        return (
            <Provider store={store}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );
    };
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
});
