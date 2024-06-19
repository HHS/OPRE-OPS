import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useGetAgreementByIdQuery, useGetBudgetLineItemQuery, useGetCansQuery } from "../../../api/opsAPI";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { useGetBLITotal } from "../../../hooks/lookup.hooks";
import { agreement, budgetLine } from "../../../tests/data";
import StatusChangeReviewCard from "./StatusChangeReviewCard";

vi.mock("../../../api/opsAPI");
vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetBLITotal: vi.fn(),
    useGetNameForCanId: vi.fn(),
    useGetAgreementName: vi.fn()
}));
describe("StatusChangeReviewCard", () => {
    useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
    useGetBudgetLineItemQuery.mockReturnValue({ data: budgetLine });
    useGetCansQuery.mockReturnValue({ data: [agreement.budget_line_items[0].can] });
    useGetBLITotal.mockReturnValue(1000000);

    const initialProps = {
        agreementId: 1,
        requesterName: "Jane Doe",
        requestDate: "2024-06-12T21:25:25.744930Z",
        bliId: 1,
        changeTo: {
            status: {
                old: BLI_STATUS.DRAFT,
                new: BLI_STATUS.PLANNED
            }
        }
    };
    it("should render the StatusChangeReviewCard component", () => {
        render(
            <BrowserRouter>
                <StatusChangeReviewCard
                    key={1}
                    {...initialProps}
                />
            </BrowserRouter>
        );

        expect(screen.getByRole("heading", { name: "Status Change" })).toBeInTheDocument();
        expect(screen.getByText("$1,000,000.00")).toBeInTheDocument();
    });
    it("should render a status change of DRAFT to PLANNED", () => {
        render(
            <BrowserRouter>
                <StatusChangeReviewCard
                    key={1}
                    {...initialProps}
                />
            </BrowserRouter>
        );

        expect(screen.getByText(/draft/i)).toBeInTheDocument();
        expect(screen.getByText(/planned/i)).toBeInTheDocument();
    });
    it("should render a status change of PLANNED to EXECUTING", () => {
        const changeTo = {
            status: {
                old: BLI_STATUS.PLANNED,
                new: BLI_STATUS.EXECUTING
            }
        };
        render(
            <BrowserRouter>
                <StatusChangeReviewCard
                    key={1}
                    {...initialProps}
                    changeTo={changeTo}
                />
            </BrowserRouter>
        );

        expect(screen.getByText(/planned/i)).toBeInTheDocument();
        expect(screen.getByText(/executing/i)).toBeInTheDocument();
    });
});
