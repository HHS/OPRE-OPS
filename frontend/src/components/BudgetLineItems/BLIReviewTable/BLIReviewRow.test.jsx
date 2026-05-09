import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { vi } from "vitest";
import { useGetUserByIdQuery } from "../../../api/opsAPI";
import store from "../../../store";
import { budgetLine } from "../../../tests/data";
import BLIReviewRow from "./BLIReviewRow";

vi.mock("../../../api/opsAPI", () => ({
    useGetUserByIdQuery: vi.fn()
}));

const createTestRouter = (component) => {
    const routes = [
        {
            path: "/agreements/review/:id",
            element: (
                <table>
                    <tbody>{component}</tbody>
                </table>
            )
        }
    ];
    return createMemoryRouter(routes, {
        initialEntries: ["/agreements/review/1"]
    });
};

const defaultBudgetLine = {
    ...budgetLine,
    status: "DRAFT",
    actionable: true,
    selected: false,
    in_review: false,
    created_by: 1,
    total: 1_000_000,
    fees: 0,
    amount: 1_000_000,
    date_needed: "2043-06-13",
    line_description: "Test description",
    can: { ...budgetLine.can, number: "G994426" },
    agreement: {
        ...budgetLine.agreement,
        procurement_shop: {
            id: 1,
            abbr: "GCS",
            current_fee: { fee: 0 }
        }
    }
};

const renderComponent = (props = {}) => {
    vi.mocked(useGetUserByIdQuery).mockReturnValue({
        data: { display_name: "John Doe", full_name: "John Doe" },
        isSuccess: true,
        isLoading: false
    });

    const defaultProps = {
        budgetLine: defaultBudgetLine,
        action: "",
        isReviewMode: false,
        showCheckbox: true,
        readOnly: false,
        setSelectedBLIs: vi.fn(),
        ...props
    };

    const router = createTestRouter(
        <Provider store={store}>
            <BLIReviewRow {...defaultProps} />
        </Provider>
    );

    return render(<RouterProvider router={router} />);
};

describe("BLIReviewRow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the row with budget line data", () => {
        renderComponent();

        expect(screen.getByRole("cell", { name: "6/13/2043" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "2043" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "G994426" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "Draft" })).toBeInTheDocument();
    });

    it("should render checkbox when showCheckbox is true", () => {
        renderComponent();

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).not.toBeDisabled();
    });

    it("should disable checkbox when budget line is not actionable", () => {
        renderComponent({
            budgetLine: { ...defaultBudgetLine, actionable: false }
        });

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeDisabled();
    });

    it("should render BL ID instead of checkbox when showCheckbox is false", () => {
        renderComponent({ showCheckbox: false });

        expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        expect(screen.getByText(defaultBudgetLine.id.toString())).toBeInTheDocument();
    });

    it("should be expandable and show expanded data", async () => {
        renderComponent();

        const user = userEvent.setup();
        const expandButton = screen.getByTestId("expand-row");
        await user.click(expandButton);

        const expandedRow = screen.getByTestId("expanded-data");
        expect(expandedRow).toBeInTheDocument();
        expect(screen.getByText("Created By")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Test description")).toBeInTheDocument();
        expect(screen.getByText("Procurement Shop")).toBeInTheDocument();
    });

    it("should display currency formatted amounts", () => {
        renderComponent({
            budgetLine: {
                ...defaultBudgetLine,
                amount: 250_000,
                fees: 1_250,
                total: 251_250
            }
        });

        expect(screen.getByRole("cell", { name: "$250,000.00" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "$1,250.00" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "$251,250.00" })).toBeInTheDocument();
    });

    it("should show tooltip for non-actionable draft BLI in review when action is change to planned", () => {
        renderComponent({
            action: "change_draft_to_planned",
            budgetLine: {
                ...defaultBudgetLine,
                actionable: false,
                status: "DRAFT",
                in_review: true
            }
        });

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeDisabled();
    });

    it("should call setSelectedBLIs when checkbox is clicked", async () => {
        const setSelectedBLIs = vi.fn();
        renderComponent({ setSelectedBLIs });

        const user = userEvent.setup();
        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);

        expect(setSelectedBLIs).toHaveBeenCalledWith(defaultBudgetLine.id.toString());
    });
});
