import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import {
    useGetAgreementByIdQuery,
    useGetBudgetLineItemQuery,
    useGetCansQuery,
    useGetChangeRequestsListQuery
} from "../../../api/opsAPI";
import store from "../../../store";
import { agreement, budgetLine, changeRequests } from "../../../tests/data";
import ChangeRequestList from "./ChangeRequestsList";

vi.mock("../../../api/opsAPI", () => ({
    useGetChangeRequestsListQuery: vi.fn(),
    useGetAgreementByIdQuery: vi.fn()
}));
vi.mock("../../../api/opsAPI");

describe("ChangeRequestList", () => {
    it("renders without any change requests", () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: {} });
        useGetAgreementByIdQuery.mockReturnValue("Agreement Name");
        render(
            <BrowserRouter>
                <ChangeRequestList />
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
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <ChangeRequestList />
                </BrowserRouter>
            </Provider>
        );

        const headings = await screen.findAllByText(/budget change/i);
        expect(headings).toHaveLength(3);
    });
});
