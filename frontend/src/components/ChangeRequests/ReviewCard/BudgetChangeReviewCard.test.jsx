import { getByText, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { useGetAgreementByIdQuery, useGetBudgetLineItemQuery, useGetCansQuery } from "../../../api/opsAPI";
import { agreement, budgetLine } from "../../../tests/data";
import BudgetChangeReviewCard from "./BudgetChangeReviewCard";

vi.mock("../../../api/opsAPI");
describe("BudgetChangeReviewCard", () => {
    const initialProps = {
        agreementId: 1,
        bliId: 1,
        changeTo: {
            amount: {
                new: 333333,
                old: 300000
            }
        },
        requestDate: "2021-01-01",
        requesterName: "John Doe"
    };
    it("should render the component", () => {
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCansQuery.mockReturnValue({ data: [agreement.budget_line_items[0].can] });
        render(
            <BrowserRouter>
                <BudgetChangeReviewCard {...initialProps} />
            </BrowserRouter>
        );

        expect(screen.getByRole("heading", { name: "Budget Change" })).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("December 31, 2020")).toBeInTheDocument();
    });
    it("should render an amount change", () => {
        useGetCansQuery.mockReturnValue({ data: [agreement.budget_line_items[0].can] });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        render(
            <BrowserRouter>
                <BudgetChangeReviewCard {...initialProps} />
            </BrowserRouter>
        );
        screen.debug();
        expect(screen.getByText("BL ID")).toBeInTheDocument();
        expect(screen.getByText("Amount")).toBeInTheDocument();
        expect(screen.getByText("$300,000")).toBeInTheDocument();
        expect(screen.getByText("$333,333")).toBeInTheDocument();
    });
});
