import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock ApplicationContext first
vi.mock("../../applicationContext/ApplicationContext", () => ({
    default: {
        get: vi.fn(() => ({
            helpers: vi.fn(() => ({
                authConfig: {
                    hhsams: {
                        auth_endpoint: "https://hhsams.example.com/auth",
                        acr_values: "test",
                        client_id: "test-client-id",
                        response_type: "code",
                        scope: "openid email profile",
                        redirect_uri: "http://localhost:3000/callback"
                    },
                    fakeauth: {
                        auth_endpoint: "https://fakeauth.example.com/auth",
                        acr_values: "test",
                        client_id: "test-client-id",
                        response_type: "code",
                        scope: "openid email profile",
                        redirect_uri: "http://localhost:3000/callback"
                    }
                }
            }))
        }))
    }
}));

const mockGetAuthorizationCode = vi.fn(() => new URL("https://mock-auth-url.com/"));
const mockSetActiveUser = vi.fn();

// Mock the auth.js file
vi.mock("./auth", () => ({
    getAuthorizationCode: (...args) => mockGetAuthorizationCode(...args),
    setActiveUser: (...args) => mockSetActiveUser(...args),
    logoutUser: vi.fn(() => new URL("https://mock-logout-url.com/")),
    CheckAuth: vi.fn(() => true),
    getAccessToken: vi.fn(() => "mock-access-token"),
    getRefreshToken: vi.fn(() => "mock-refresh-token"),
    isValidToken: vi.fn(() => ({ isValid: true, msg: "VALID" }))
}));

// Mock the loginMutation
const mockLoginMutation = vi.fn();
const mockUnwrap = vi.fn();
mockLoginMutation.mockReturnValue({ unwrap: mockUnwrap });

vi.mock("../../api/opsAuthAPI", () => ({
    useLoginMutation: () => [mockLoginMutation]
}));

// Import other dependencies after the mocks
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../store";
import MultiAuthSection from "./MultiAuthSection";

// Back the global localStorage mock with a real Map so get/set/remove work
const storage = new Map();

describe("MultiAuthSection", () => {
    let store;

    beforeEach(() => {
        store = setupStore();
        storage.clear();
        vi.clearAllMocks();

        // Wire up the global localStorage mock (defined in setupTests.jsx) to a real store
        localStorage.getItem.mockImplementation((key) => storage.get(key) ?? null);
        localStorage.setItem.mockImplementation((key, value) => storage.set(key, String(value)));
        localStorage.removeItem.mockImplementation((key) => storage.delete(key));
        localStorage.clear.mockImplementation(() => storage.clear());

        // Reset URL
        window.history.pushState({}, "", "/");
    });

    afterEach(() => {
        storage.clear();
    });

    const renderWithProviders = (ui) => {
        return render(
            <Provider store={store}>
                <MemoryRouter>{ui}</MemoryRouter>
            </Provider>
        );
    };

    it("renders login options", () => {
        renderWithProviders(<MultiAuthSection />);
        expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    });

    it("generates ops-state-key on mount when none exists", async () => {
        renderWithProviders(<MultiAuthSection />);
        await waitFor(() => {
            expect(localStorage.setItem).toHaveBeenCalledWith("ops-state-key", expect.any(String));
        });
        const stateKey = storage.get("ops-state-key");
        expect(stateKey).toHaveLength(64);
    });

    describe("handleSSOLogin", () => {
        it("encodes provider in the state parameter before redirect", async () => {
            renderWithProviders(<MultiAuthSection />);

            // Wait for useEffect to set the state key
            await waitFor(() => {
                expect(storage.has("ops-state-key")).toBe(true);
            });
            const stateKeyBefore = storage.get("ops-state-key");
            expect(stateKeyBefore).toHaveLength(64);

            fireEvent.click(screen.getByText("Sign in with HHS AMS"));

            // State key should now include the provider
            const stateKeyAfter = storage.get("ops-state-key");
            expect(stateKeyAfter).toBe(`${stateKeyBefore}|hhsams`);

            // getAuthorizationCode should be called with the state including provider
            expect(mockGetAuthorizationCode).toHaveBeenCalledWith("hhsams", `${stateKeyBefore}|hhsams`);
        });

        it("sets activeProvider in localStorage for backward compatibility", async () => {
            renderWithProviders(<MultiAuthSection />);

            await waitFor(() => {
                expect(storage.has("ops-state-key")).toBe(true);
            });

            fireEvent.click(screen.getByText("Sign in with HHS AMS"));

            expect(storage.get("activeProvider")).toBe("hhsams");
        });
    });

    describe("OAuth callback - provider extraction from state", () => {
        it("extracts provider from state parameter and passes it to callBackend", async () => {
            const stateWithProvider = "abc123|hhsams";
            storage.set("ops-state-key", stateWithProvider);

            mockUnwrap.mockResolvedValue({
                access_token: "test-access-token",
                refresh_token: "test-refresh-token"
            });

            // Set URL with query params before rendering
            window.history.pushState({}, "", `/login?state=${encodeURIComponent(stateWithProvider)}&code=AUTH_CODE_123`);

            renderWithProviders(<MultiAuthSection />);

            await waitFor(() => {
                expect(mockLoginMutation).toHaveBeenCalledWith({
                    provider: "hhsams",
                    code: "AUTH_CODE_123"
                });
            });
        });

        it("works when activeProvider is missing from localStorage (race condition scenario)", async () => {
            const stateWithProvider = "abc123|hhsams";
            storage.set("ops-state-key", stateWithProvider);
            // Deliberately NOT setting activeProvider to simulate the race condition

            mockUnwrap.mockResolvedValue({
                access_token: "test-access-token",
                refresh_token: "test-refresh-token"
            });

            window.history.pushState({}, "", `/login?state=${encodeURIComponent(stateWithProvider)}&code=AUTH_CODE_123`);

            renderWithProviders(<MultiAuthSection />);

            await waitFor(() => {
                expect(mockLoginMutation).toHaveBeenCalledWith({
                    provider: "hhsams",
                    code: "AUTH_CODE_123"
                });
            });
        });

        it("falls back to localStorage when state has no provider (backward compat)", async () => {
            const stateWithoutProvider = "abc123nopipe";
            storage.set("ops-state-key", stateWithoutProvider);
            storage.set("activeProvider", "hhsams");

            mockUnwrap.mockResolvedValue({
                access_token: "test-access-token",
                refresh_token: "test-refresh-token"
            });

            window.history.pushState({}, "", `/login?state=${stateWithoutProvider}&code=AUTH_CODE_456`);

            renderWithProviders(<MultiAuthSection />);

            await waitFor(() => {
                expect(mockLoginMutation).toHaveBeenCalledWith({
                    provider: "hhsams",
                    code: "AUTH_CODE_456"
                });
            });
        });
    });
});
