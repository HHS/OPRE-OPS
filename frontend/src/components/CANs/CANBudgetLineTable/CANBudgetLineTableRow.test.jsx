import { screen } from "@testing-library/react";
import CANBudgetLineTableRow from "./CANBudgetLineTableRow";
import { formatDateNeeded } from "../../../helpers/utils";
import { renderWithProviders } from "../../../test-utils";
import { budgetLine } from "../../../tests/data";
import userEvent from "@testing-library/user-event";

const mockBudgetLine = {
    ...budgetLine,
    id: 1,
    date_needed: "2023-10-01",
    fiscal_year: 2023,
    amount: 1000,
    fees: 50,
    total: 1050,
    proc_shop_fee_percentage: 5.0,
    status: "Pending",
    in_review: true,
    created_by: 1,
    created_on: "2023-09-01",
    line_description: "Test Description",
    agreement: {
        ...budgetLine.agreement,
        procurement_shop: {
            id: 1,
            abbr: "TBD",
            current_fee: { fee: 5.0 }
        }
    }
};

describe("CANBudgetLineTableRow", () => {
    test("renders table row data correctly", () => {
        renderWithProviders(
            <CANBudgetLineTableRow
                budgetLine={mockBudgetLine}
                blId={mockBudgetLine.id}
                agreementName="TBD"
                obligateDate={formatDateNeeded(mockBudgetLine.date_needed)}
                fiscalYear={mockBudgetLine.fiscal_year}
                amount={mockBudgetLine.amount}
                fee={mockBudgetLine.proc_shop_fee_percentage}
                percentOfCAN={3}
                status={mockBudgetLine.status}
                inReview={mockBudgetLine.in_review}
                creatorId={mockBudgetLine.created_by}
                creationDate={mockBudgetLine.created_on}
                procShopCode="TBD"
            />
        );

        expect(screen.getByText("TBD")).toBeInTheDocument();
        expect(screen.getByText(formatDateNeeded(mockBudgetLine.date_needed))).toBeInTheDocument();
        expect(screen.getByText(mockBudgetLine.fiscal_year)).toBeInTheDocument();
        expect(screen.getByText("$1,050.00")).toBeInTheDocument(); // amount + fee
        expect(screen.getByText("3%")).toBeInTheDocument();
    });

    test("renders expanded data correctly", async () => {
        renderWithProviders(
            <CANBudgetLineTableRow
                budgetLine={mockBudgetLine}
                blId={mockBudgetLine.id}
                agreementName="TBD"
                obligateDate={formatDateNeeded(mockBudgetLine.date_needed)}
                fiscalYear={mockBudgetLine.fiscal_year}
                amount={mockBudgetLine.amount}
                fee={mockBudgetLine.proc_shop_fee_percentage}
                percentOfCAN={3}
                status={mockBudgetLine.status}
                inReview={mockBudgetLine.in_review}
                creatorId={mockBudgetLine.created_by}
                creationDate={mockBudgetLine.created_on}
                procShopCode="TBD"
                description={mockBudgetLine.line_description}
            />
        );

        // Simulate expanding the row
        await userEvent.click(screen.getByTestId("expand-row"));

        expect(screen.getByText("Created By")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Procurement Shop")).toBeInTheDocument();
        expect(screen.getByText("$1,000.00")).toBeInTheDocument(); // amount
        expect(screen.getByText("$50.00")).toBeInTheDocument(); // fee
    });

    test("records the provided ancestry as the breadcrumb trail when the agreement link is clicked", async () => {
        // Ancestry as it would arrive under the Portfolio spending tab:
        // Portfolios > Portfolio A > CAN 1
        const ancestry = [
            { label: "Portfolios", to: "/portfolios" },
            { label: "Portfolio A", to: "/portfolios/5" },
            { label: "CAN 1", to: "/cans/1" }
        ];
        const { store } = renderWithProviders(
            <CANBudgetLineTableRow
                budgetLine={mockBudgetLine}
                blId={mockBudgetLine.id}
                agreementName="TBD"
                obligateDate={formatDateNeeded(mockBudgetLine.date_needed)}
                fiscalYear={mockBudgetLine.fiscal_year}
                amount={mockBudgetLine.amount}
                percentOfCAN={3}
                status={mockBudgetLine.status}
                inReview={mockBudgetLine.in_review}
                creatorId={mockBudgetLine.created_by}
                creationDate={mockBudgetLine.created_on}
                description={mockBudgetLine.line_description}
                ancestry={ancestry}
            />
        );

        await userEvent.click(screen.getByRole("link"));

        const trail = store.getState().sessionUI.navContext.trail;
        expect(trail.targetPath).toBe(`/agreements/${mockBudgetLine.agreement.id}`);
        expect(trail.ancestors).toEqual(ancestry);
    });
});
