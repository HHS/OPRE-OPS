import { beforeEach, describe, expect, it, vi } from "vitest";

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

// Mock the auth.js file
vi.mock("./auth", () => ({
    getAuthorizationCode: vi.fn(() => new URL("https://mock-auth-url.com/")),
    setActiveUser: vi.fn(),
    logoutUser: vi.fn(() => new URL("https://mock-logout-url.com/")),
    CheckAuth: vi.fn(() => true),
    getAccessToken: vi.fn(() => "mock-access-token"),
    getRefreshToken: vi.fn(() => "mock-refresh-token"),
    isValidToken: vi.fn(() => ({ isValid: true, msg: "VALID" }))
}));

// Import other dependencies after the mocks
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../store";
import MultiAuthSection from "./MultiAuthSection";

// Simple describe block to check if test is running
describe("MultiAuthSection", () => {
    let store;

    beforeEach(() => {
        store = setupStore();
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
});
