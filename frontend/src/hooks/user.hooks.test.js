import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../store";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import { useIsUserOfRoleType, useGetLoggedInUserFullName } from "./user.hooks";
import { USER_ROLES } from "../components/Users/User.constants";

// Helper function to create wrapper with Redux provider
function createWrapper(preloadedState = {}) {
    const store = setupStore(preloadedState);
    setupListeners(store.dispatch);

    function Wrapper({ children }) {
        return (
            <Provider store={store}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );
    }

    return { Wrapper, store };
}

describe("useIsUserOfRoleType", () => {
    it("returns true when user has the specified role", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: {
                    id: 1,
                    full_name: "Test User",
                    email: "test@example.com",
                    roles: [
                        { id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true },
                        { id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }
                    ]
                }
            }
        });

        const { result } = renderHook(() => useIsUserOfRoleType(USER_ROLES.SUPER_USER), {
            wrapper: Wrapper
        });

        expect(result.current).toBe(true);
    });

    it("returns false when user does not have the specified role", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: {
                    id: 1,
                    full_name: "Test User",
                    email: "test@example.com",
                    roles: [{ id: 2, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false }]
                }
            }
        });

        const { result } = renderHook(() => useIsUserOfRoleType(USER_ROLES.SUPER_USER), {
            wrapper: Wrapper
        });

        expect(result.current).toBe(false);
    });

    it("returns false when user has no roles", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: {
                    id: 1,
                    full_name: "Test User",
                    email: "test@example.com",
                    roles: []
                }
            }
        });

        const { result } = renderHook(() => useIsUserOfRoleType(USER_ROLES.SUPER_USER), {
            wrapper: Wrapper
        });

        expect(result.current).toBe(false);
    });

    it("returns false when user has null/undefined roles", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: {
                    id: 1,
                    full_name: "Test User",
                    email: "test@example.com",
                    roles: null
                }
            }
        });

        const { result } = renderHook(() => useIsUserOfRoleType(USER_ROLES.SUPER_USER), {
            wrapper: Wrapper
        });

        expect(result.current).toBe(false);
    });

    it("returns false when no active user exists", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: null
            }
        });

        const { result } = renderHook(() => useIsUserOfRoleType(USER_ROLES.SUPER_USER), {
            wrapper: Wrapper
        });

        expect(result.current).toBe(false);
    });

    it("returns false when auth state is empty", () => {
        const { Wrapper } = createWrapper({});

        const { result } = renderHook(() => useIsUserOfRoleType(USER_ROLES.SUPER_USER), {
            wrapper: Wrapper
        });

        expect(result.current).toBe(false);
    });
});

describe("useGetLoggedInUserFullName", () => {
    it("returns full name when available", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: {
                    id: 1,
                    full_name: "John Doe",
                    first_name: "John",
                    email: "john.doe@example.com"
                }
            }
        });

        const { result } = renderHook(() => useGetLoggedInUserFullName(), {
            wrapper: Wrapper
        });

        expect(result.current).toBe("John Doe");
    });

    it("returns first name when full name is not available", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: {
                    id: 1,
                    full_name: null,
                    first_name: "John",
                    email: "john.doe@example.com"
                }
            }
        });

        const { result } = renderHook(() => useGetLoggedInUserFullName(), {
            wrapper: Wrapper
        });

        expect(result.current).toBe("John");
    });

    it("returns email when full name and first name are not available", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: {
                    id: 1,
                    full_name: null,
                    first_name: null,
                    email: "john.doe@example.com"
                }
            }
        });

        const { result } = renderHook(() => useGetLoggedInUserFullName(), {
            wrapper: Wrapper
        });

        expect(result.current).toBe("john.doe@example.com");
    });

    it("returns 'TBD' when no user information is available", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: {
                    id: 1,
                    full_name: null,
                    first_name: null,
                    email: null
                }
            }
        });

        const { result } = renderHook(() => useGetLoggedInUserFullName(), {
            wrapper: Wrapper
        });

        expect(result.current).toBe("TBD");
    });

    it("returns 'TBD' when no active user exists", () => {
        const { Wrapper } = createWrapper({
            auth: {
                activeUser: null
            }
        });

        const { result } = renderHook(() => useGetLoggedInUserFullName(), {
            wrapper: Wrapper
        });

        expect(result.current).toBe("TBD");
    });
});
