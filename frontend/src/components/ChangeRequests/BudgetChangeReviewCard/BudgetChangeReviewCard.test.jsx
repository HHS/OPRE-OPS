import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import {
    useGetAgreementByIdQuery,
    useGetBudgetLineItemQuery,
    useGetCansQuery,
    useReviewChangeRequestMutation
} from "../../../api/opsAPI";
import { useGetAgreementName, useGetBLIStatus, useGetNameForCanId } from "../../../hooks/lookup.hooks";
import { agreement, budgetLine } from "../../../tests/data";
import BudgetChangeReviewCard from "./BudgetChangeReviewCard";

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetNameForCanId: vi.fn(),
    useGetBLIStatus: vi.fn(),
    useGetAgreementName: vi.fn()
}));
vi.mock("../../../api/opsAPI");
describe("BudgetChangeReviewCard", () => {
    useGetBLIStatus.mockReturnValue("Draft");
    useGetAgreementName.mockReturnValue("Agreement Name");
    useReviewChangeRequestMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
    const initialProps = {
        agreementId: 1,
        bliId: 1,
        changeTo: {
            amount: {
                new: 333333,
                old: 300000
            }
        },
        requestDate: "2024-06-12T21:25:25.744930Z",
        requesterName: "John Doe",
        changeRequestId: 1,
        handleReviewChangeRequest: vi.mock
    };
    it("should render the component", () => {
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCansQuery.mockReturnValue({ data: [agreement.budget_line_items[0].can] });
        render(
            <BrowserRouter>
                <BudgetChangeReviewCard
                    {...initialProps}
                    key={1}
                />
            </BrowserRouter>
        );

        expect(screen.getByRole("heading", { name: "Budget Change" })).toBeInTheDocument();
        expect(screen.getByText("Agreement Name")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("June 12, 2024")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("Draft")).toBeInTheDocument();
    });
    it("should render an amount change", () => {
        render(
            <BrowserRouter>
                <BudgetChangeReviewCard
                    {...initialProps}
                    key={1}
                />
            </BrowserRouter>
        );

        expect(screen.getByText("Amount")).toBeInTheDocument();
        expect(screen.getByText("$300,000.00")).toBeInTheDocument();
        expect(screen.getByText("$333,333.00")).toBeInTheDocument();
    });
    it("should render an CAN change", async () => {
        useGetNameForCanId.mockReturnValueOnce("CAN 1").mockReturnValueOnce("CAN 2");

        const changeTo = {
            can_id: {
                new: 10,
                old: 13
            }
        };
        render(
            <BrowserRouter>
                <BudgetChangeReviewCard
                    {...initialProps}
                    key={1}
                    changeTo={changeTo}
                />
            </BrowserRouter>
        );

        const label = await screen.findByText("CAN");
        const fromValue = await screen.findByText(/can 1/i);
        const toValue = await screen.findByText(/can 2/i);

        expect(label).toBeInTheDocument();
        expect(fromValue).toBeInTheDocument();
        expect(toValue).toBeInTheDocument();
    });
    it("should render an date needed change", () => {
        const changeTo = {
            date_needed: {
                new: "2045-06-13",
                old: "2044-06-01"
            }
        };
        render(
            <BrowserRouter>
                <BudgetChangeReviewCard
                    {...initialProps}
                    key={1}
                    changeTo={changeTo}
                />
            </BrowserRouter>
        );

        expect(screen.getByText("Date needed")).toBeInTheDocument();
        expect(screen.getByText("6/1/2044")).toBeInTheDocument();
        expect(screen.getByText("6/13/2045")).toBeInTheDocument();
    });
});
