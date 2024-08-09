import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import {
    useGetAgreementByIdQuery,
    useGetBudgetLineItemQuery,
    useGetCansQuery,
    useGetChangeRequestsListQuery,
    useReviewChangeRequestMutation
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { agreement, budgetLine, changeRequests } from "../../../tests/data";
import ChangeRequestList from "./ChangeRequestsList";

vi.mock("../../../api/opsAPI");
vi.mock("../../../hooks/user.hooks");
describe("ChangeRequestList", () => {
    useReviewChangeRequestMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
    it("renders without any change requests", () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: {} });
        useGetAgreementByIdQuery.mockReturnValue("Agreement Name");
        useGetUserFullNameFromId.mockReturnValue("unknown");

        render(
            <BrowserRouter>
                <ChangeRequestList handleReviewChangeRequest={vi.mock} />
            </BrowserRouter>
        );
        expect(screen.getByText(/no changes/i)).toBeInTheDocument();
    });
    it("renders with change requests", async () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: changeRequests });
        useGetAgreementByIdQuery.mockReturnValue("Agreement Name");
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCansQuery.mockReturnValue({ data: [agreement.budget_line_items[0].can] });
        useGetUserFullNameFromId.mockReturnValue("unknown");

        render(
            <BrowserRouter>
                <ChangeRequestList handleReviewChangeRequest={vi.mock} />
            </BrowserRouter>
        );

        const headings = await screen.findAllByText(/budget change/i);
        expect(headings).toHaveLength(3);
    });
});
