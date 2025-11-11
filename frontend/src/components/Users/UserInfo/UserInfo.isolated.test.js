import { vi, describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";

// Create a minimal store
const mockStore = configureStore({
    reducer: {
        // Minimal reducer
        test: (state = {}) => state
    }
});

// Mock ALL external dependencies completely
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn()
    };
});

vi.mock("../../../hooks/use-alert.hooks.js", () => ({
    default: () => ({ setAlert: vi.fn() })
}));

vi.mock("react-redux", async () => {
    const actual = await vi.importActual("react-redux");
    return {
        ...actual,
        useDispatch: () => vi.fn()
    };
});

vi.mock("../../../api/opsAPI.js", () => ({
    useGetDivisionsQuery: () => ({
        data: [{ id: 1, name: "Test Division" }],
        error: null,
        isLoading: false
    }),
    useUpdateUserMutation: () => [vi.fn(), { isSuccess: false, isError: false }]
}));

vi.mock("../../../api/opsAuthAPI.js", () => ({
    useGetRolesQuery: () => ({
        data: [{ name: "TEST_ROLE" }],
        error: null,
        isLoading: false
    })
}));

// Mock the component to just render basic HTML
vi.mock("../../UI/Form/ComboBox", () => ({
    default: ({ testId }) => <div data-testid={testId}>Mocked ComboBox</div>
}));

// Simple test component wrapper
const TestWrapper = ({ children }) => (
    <Provider store={mockStore}>
        <MemoryRouter>
            {children}
        </MemoryRouter>
    </Provider>
);

// Import the actual component
import UserInfo from "./UserInfo";

describe("UserInfo Isolated Test", () => {
    test("should render UserInfo component", async () => {
        const mockUser = {
            id: 1,
            full_name: "Test User",
            email: "test@example.com",
            division: 1,
            status: "ACTIVE",
            roles: ["TEST_ROLE"]
        };

        const { container } = render(
            <TestWrapper>
                <UserInfo user={mockUser} isEditable={false} />
            </TestWrapper>
        );

        expect(container).toBeInTheDocument();
        expect(screen.getByText("Test User")).toBeInTheDocument();
    });
});
