import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { opsApi } from "../../../api/opsAPI";
import CANDetailForm from "./CANDetailForm";

// Mock data
const mockCan = {
    id: 123,
    number: "CAN-001",
    nick_name: "Test CAN",
    description: "Test Description",
    portfolio_id: 456
};

// Mock store setup
const store = configureStore({
    reducer: {
        [opsApi.reducerPath]: opsApi.reducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware)
});

vi.mock("react-redux", async () => {
    const actual = await vi.importActual("react-redux");
    return {
        ...actual,
        useSelector: vi.fn((selector) => {
            // Mock the auth state
            const mockState = {
                alert: {
                    isActive: false
                }
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
                toggleEditMode={vi.fn()}
            />
        </Provider>
    );
};

describe("CANDetailForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders form with initial values", () => {
        renderComponent();

        expect(screen.getByLabelText(/nickname/i)).toHaveValue(mockCan.nick_name);
        expect(screen.getByLabelText(/description/i)).toHaveValue(mockCan.description);
    });

    test("validates required nickname field", async () => {
        renderComponent();
        const nicknameInput = screen.getByLabelText(/nickname/i);

        await userEvent.clear(nicknameInput);
        fireEvent.blur(nicknameInput);

        expect(await screen.findByText("This is required information")).toBeInTheDocument();
    });

    test("shows confirmation modal when canceling", async () => {
        renderComponent();

        const cancelButton = screen.getByText(/cancel/i);
        await userEvent.click(cancelButton);

        expect(screen.getByText(/are you sure you want to cancel editing/i)).toBeInTheDocument();
    });
});
