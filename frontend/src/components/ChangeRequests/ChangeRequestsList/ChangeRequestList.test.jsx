import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import configureStore from "redux-mock-store";
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

const mockStore = configureStore([]);

vi.mock("../../../api/opsAPI");
vi.mock("../../../hooks/user.hooks");
describe("ChangeRequestList", () => {
    useReviewChangeRequestMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    const initialState = {
        auth: {
            activeUser: {
                id: 500,
                name: "Test User",
                division: 1
            }
        },
        alert: {
            isActive: false
        }
    };
    const store = mockStore(initialState);

    it("renders without any change requests", () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: {} });
        useGetAgreementByIdQuery.mockReturnValue("Agreement Name");
        useGetUserFullNameFromId.mockReturnValue("unknown");

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <ChangeRequestList handleReviewChangeRequest={vi.mock} />
                </BrowserRouter>
            </Provider>
        );
        expect(screen.getByText(/no changes/i)).toBeInTheDocument();
    });
    it("renders with change requests", async () => {
        const mockChangeRequests = [
            { ...changeRequests[0]},
            { ...changeRequests[1]},
            { ...changeRequests[2]}
        ];

        useGetChangeRequestsListQuery.mockReturnValue({ data: mockChangeRequests });
        useGetAgreementByIdQuery.mockReturnValue("Agreement Name");
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCansQuery.mockReturnValue({ data: [agreement.budget_line_items[0].can] });
        useGetUserFullNameFromId.mockReturnValue("unknown");

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <ChangeRequestList handleReviewChangeRequest={vi.mock} />
                </BrowserRouter>
            </Provider>
        );

        const headings = await screen.findAllByText(/budget change/i);
        expect(headings).toHaveLength(3);
    });
});
