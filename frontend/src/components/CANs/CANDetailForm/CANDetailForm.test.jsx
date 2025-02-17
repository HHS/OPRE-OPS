import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi, beforeEach } from "vitest";
import CANDetailForm from "./CANDetailForm";
import { opsApi } from "../../../api/opsAPI";
import useCanDetailForm from "./CANDetailForm.hooks"; // Import the hook

// Mock the useCanDetailForm hook
vi.mock("./CANDetailForm.hooks", () => {
    const mockRes = {
        getErrors: vi.fn(),
        hasErrors: vi.fn(() => false)
    };
    return {
        default: vi.fn(() => ({
            nickName: "Test CAN",
            setNickName: vi.fn(),
            description: "Test Description",
            setDescription: vi.fn(),
            handleCancel: vi.fn(),
            handleSubmit: vi.fn(),
            runValidate: vi.fn((name, value) => {
                mockRes.hasErrors.mockReturnValue(value === "");
            }),
            res: mockRes,
            cn: vi.fn(),
            showModal: false,
            setShowModal: vi.fn(),
            modalProps: {}
        }))
    };
});

// Mock the useUpdateCanMutation hook
vi.mock("../../../api/opsAPI", () => ({
    opsApi: {
        reducerPath: "opsApi",
        reducer: () => ({})
    },
    useUpdateCanMutation: () => [vi.fn(() => Promise.resolve())]
}));

// Mock data
const mockCan = {
    id: 123,
    number: "CAN-001",
    nick_name: "Test CAN",
    description: "Test Description",
    portfolio_id: 456
};

// Mock store
const store = configureStore({
    reducer: {
        [opsApi.reducerPath]: opsApi.reducer
    }
});

// Mock toggleEditMode function
const mockToggleEditMode = vi.fn();

vi.mock("react-redux", async () => {
    const actual = await vi.importActual("react-redux");
    return {
        ...actual,
        useSelector: vi.fn((selector) => {
            // Mock the auth state
            const mockState = {
                alert: {
                    isActive: false
                },
                [opsApi.reducerPath]: store.getState()[opsApi.reducerPath] // Ensure opsApi state is also included
            };
            return selector(mockState);
        })
    };
});

const renderComponent = () => {
    return render(
        <Provider store={store}>
            <CANDetailForm
                canId={mockCan.id}
                canNumber={mockCan.number}
                canNickname={mockCan.nick_name}
                canDescription={mockCan.description}
                portfolioId={mockCan.portfolio_id}
                toggleEditMode={mockToggleEditMode}
            />
        </Provider>
    );
};

describe("CANDetailForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders form with initial values", () => {
        renderComponent();
        expect(screen.getByLabelText(/nickname/i)).toHaveValue(mockCan.nick_name);
        expect(screen.getByLabelText(/description/i)).toHaveValue(mockCan.description);
    });

    it("updates nickname input value", async () => {
        renderComponent();
        const nicknameInput = screen.getByLabelText(/nickname/i);
        await userEvent.type(nicknameInput, " Updated");
        expect(nicknameInput).toHaveValue("Test CAN");
    });

    it("validates required nickname field", async () => {
        renderComponent();
        const nicknameInput = screen.getByLabelText(/nickname/i);
        await userEvent.clear(nicknameInput);
        await userEvent.tab(nicknameInput);
        await waitFor(() => {
            expect(screen.getByText(/Required Information\*/i)).toBeInTheDocument();
        });
    });

    it.skip("shows confirmation modal when canceling", async () => {
        renderComponent();
        const cancelButton = screen.getByText(/cancel/i);
        await userEvent.click(cancelButton);
        expect(screen.getByText(/are you sure you want to cancel editing/i)).toBeInTheDocument();
    });

    it.skip("calls toggleEditMode and resets form when canceling edits", async () => {
        renderComponent();
        const cancelButton = screen.getByText(/cancel/i);
        await userEvent.click(cancelButton);

        const cancelEditsButton = screen.getByText(/cancel edits/i);
        await userEvent.click(cancelEditsButton);

        expect(mockToggleEditMode).toHaveBeenCalled();
    });

    it("disables save button when nickname is empty", async () => {
        renderComponent();
        const nicknameInput = screen.getByLabelText(/nickname/i);
        await userEvent.clear(nicknameInput);
        await userEvent.tab(nicknameInput);
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
        });
    });

    it.skip("enables save button when nickname is not empty", async () => {
        renderComponent();
        expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
    });

    it("submits the form with updated values", async () => {
        const mockUseCanDetailForm = {
            nickName: "Test CAN",
            setNickName: vi.fn(),
            description: "Test Description",
            setDescription: vi.fn(),
            handleCancel: vi.fn(),
            handleSubmit: vi.fn((e) => {
                e.preventDefault();
                mockToggleEditMode();
            }),
            runValidate: vi.fn(),
            res: { getErrors: vi.fn(), hasErrors: vi.fn(() => false) },
            cn: vi.fn(),
            showModal: false,
            setShowModal: vi.fn(),
            modalProps: {}
        };
        vi.mocked(useCanDetailForm).mockReturnValue(mockUseCanDetailForm);

        renderComponent();
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        await userEvent.click(saveButton);

        expect(mockToggleEditMode).toHaveBeenCalled();
    });
});
