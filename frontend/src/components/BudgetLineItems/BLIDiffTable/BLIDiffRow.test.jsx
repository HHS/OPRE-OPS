import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { vi } from "vitest";
import { useGetAgreementByIdQuery, useGetCansQuery, useGetUserByIdQuery } from "../../../api/opsAPI";
import store from "../../../store";
import {
    agreement,
    budgetLineWithBudgetChangeRequest,
    budgetLineWithStatusChangeRequestToExecuting,
    budgetLineWithStatusChangeRequestToPlanned
} from "../../../tests/data";
import BLIDiffRow from "./BLIDiffRow";

// Mock the API hooks
vi.mock("../../../api/opsAPI", () => ({
    useGetUserByIdQuery: vi.fn(),
    useGetAgreementByIdQuery: vi.fn(),
    useGetCansQuery: vi.fn()
}));

vi.mock("react-redux", async () => {
    const actual = await vi.importActual("react-redux");
    return {
        ...actual,
        useSelector: vi.fn((selector) => {
            // Mock the auth state
            const mockState = {
                auth: {
                    activeUser: {
                        division: 1
                    }
                }
            };
            return selector(mockState);
        })
    };
});

// Create router configuration
const createTestRouter = (component) => {
    const routes = [
        {
            path: "/agreements/approve/:id",
            element: component
        }
    ];
    return createMemoryRouter(routes, {
        initialEntries: ["/agreements/approve/1?type=budget-change"]
    });
};

const renderComponent = (additionalProps = {}) => {
    // Setup mock returns
    vi.mocked(useGetUserByIdQuery).mockReturnValue({ data: "John Doe", isLoading: false });
    vi.mocked(useGetAgreementByIdQuery).mockReturnValue({ data: agreement, isLoading: false });
    vi.mocked(useGetCansQuery).mockReturnValue({
        data: [{ id: 1, code: "CAN 1", name: "CAN 1" }],
        isLoading: false
    });

    const defaultProps = {
        budgetLine: {
            ...budgetLineWithBudgetChangeRequest,
            created_by_user: "John Doe",
            updated_by_user: "John Doe",
            updated_by: 1
        },
        changeType: "Budget Change",
        statusChangeTo: ""
    };

    const router = createTestRouter(
        <Provider store={store}>
            <BLIDiffRow
                {...defaultProps}
                {...additionalProps}
            />
        </Provider>
    );

    render(<RouterProvider router={router} />);
};

describe("BLIRow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the BLIRow component", () => {
        renderComponent();

        const needByDate = screen.getByRole("cell", { name: "6/13/2044" });
        const FY = screen.getByRole("cell", { name: "2044" });
        const status = screen.getByRole("cell", { name: "Planned" });
        const currentDollarAmount = screen.queryByText("$300,000.00");
        const CAN = screen.getByRole("cell", { name: "G99XXX8" });

        expect(needByDate).toBeInTheDocument();
        expect(FY).toBeInTheDocument();
        expect(status).toBeInTheDocument();
        expect(currentDollarAmount).toBeInTheDocument();
        expect(CAN).toBeInTheDocument();
    });

    it("should be expandable", async () => {
        renderComponent();

        const user = userEvent.setup();
        const expandButton = screen.getByTestId("expand-row");
        await user.click(expandButton);
        const expandedRow = screen.getByTestId("expanded-data");
        const createdBy = screen.getByText("unknown");
        const createdDate = screen.getByText("July 26, 2024");
        const notes = screen.getByText(/no notes added/i);

        expect(expandedRow).toBeInTheDocument();
        expect(createdBy).toBeInTheDocument();
        expect(createdDate).toBeInTheDocument();
        expect(notes).toBeInTheDocument();
    });

    it("should highlight changed fields for budget change", () => {
        renderComponent();
        const amountCell = screen.getByRole("cell", { name: "$300,000.00" });
        const canCell = screen.getByRole("cell", { name: "G99XXX8" });
        const obligateByCell = screen.getByRole("cell", { name: "6/13/2044" });

        expect(amountCell).toHaveClass("table-item-diff");
        expect(canCell).toHaveClass("table-item-diff");
        expect(obligateByCell).toHaveClass("table-item-diff");
    });

    it("should highlight changed fields for status change to EXECUTING", () => {
        renderComponent({
            changeType: "Status Change",
            statusChangeTo: "EXECUTING",
            budgetLine: {
                ...budgetLineWithStatusChangeRequestToExecuting,
                created_by_user: "John Doe",
                updated_by_user: "John Doe",
                updated_by: 1
            }
        });

        const statusCell = screen.getByRole("cell", { name: "Executing" });
        expect(statusCell).toHaveClass("table-item-diff");
    });

    it("should highlight changed fields for status change to PLANNED", () => {
        renderComponent({
            changeType: "Status Change",
            statusChangeTo: "PLANNED",
            budgetLine: {
                ...budgetLineWithStatusChangeRequestToPlanned,
                created_by_user: "John Doe",
                updated_by_user: "John Doe",
                updated_by: 1
            }
        });

        const statusCell = screen.getByRole("cell", { name: "Planned" });
        expect(statusCell).toHaveClass("table-item-diff");
    });

    it("should display correct fee and total amounts", () => {
        renderComponent();
        const amount = screen.getByRole("cell", { name: "$300,000.00" });
        const feeAmount = screen.getByRole("cell", { name: "$1,500.00" });
        const totalAmount = screen.getByRole("cell", { name: "$301,500.00" });

        expect(amount).toBeInTheDocument();
        expect(feeAmount).toBeInTheDocument();
        expect(totalAmount).toBeInTheDocument();
    });

    it("should render the BLIDiffRow component with null budgetLine prop", () => {
        renderComponent({ budgetLine: null });
        const errorText = screen.getByText("Error: Budget line is not present");
        expect(errorText).toBeInTheDocument();
    });
});
