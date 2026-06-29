import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import configureStore from "redux-mock-store";
import { vi } from "vitest";
import {
    useGetAgreementByIdQuery,
    useGetBudgetLineItemQuery,
    useGetCansQuery,
    useGetCanByIdQuery,
    useLazyGetCansQuery,
    useGetChangeRequestsListQuery,
    useGetPendingPreAwardApprovalsQuery,
    useGetPendingBudgetRequisitionsQuery,
    useUpdateChangeRequestMutation
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { agreement, budgetLine, changeRequests } from "../../../tests/data";
import ChangeRequestList from "./ChangeRequestsList";

const mockStore = configureStore([]);

vi.mock("../../../api/opsAPI");
vi.mock("../../../hooks/user.hooks");
describe("ChangeRequestList", () => {
    useUpdateChangeRequestMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
    useLazyGetCansQuery.mockReturnValue([
        vi.fn().mockResolvedValue({ unwrap: () => Promise.resolve({ cans: [], count: 0 }) }),
        { isLoading: false, isError: false }
    ]);

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
        useGetChangeRequestsListQuery.mockReturnValue({ data: { data: [], count: 0, limit: 1000, offset: 0 } });
        useGetPendingPreAwardApprovalsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetPendingBudgetRequisitionsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetAgreementByIdQuery.mockReturnValue("Agreement Name");
        useGetCanByIdQuery.mockReturnValue({ data: { display_name: "CAN Name" }, isSuccess: true });
        useGetUserFullNameFromId.mockReturnValue("unknown");

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <ChangeRequestList handleReviewChangeRequest={vi.mock} />
                </BrowserRouter>
            </Provider>
        );
        expect(useGetChangeRequestsListQuery).toHaveBeenCalledWith(
            { userId: 500, limit: 1000, offset: 0 },
            { refetchOnMountOrArgChange: true, skip: false }
        );
        expect(screen.getByText(/no changes/i)).toBeInTheDocument();
    });
    it("renders with change requests", async () => {
        const mockChangeRequests = [{ ...changeRequests[0] }, { ...changeRequests[1] }, { ...changeRequests[2] }];

        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: mockChangeRequests, count: mockChangeRequests.length, limit: 10, offset: 0 }
        });
        useGetPendingPreAwardApprovalsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetPendingBudgetRequisitionsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetAgreementByIdQuery.mockReturnValue("Agreement Name");
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCanByIdQuery.mockReturnValue({
            data: agreement.budget_line_items[0].can,
            isSuccess: true
        });
        useGetCansQuery.mockReturnValue({
            data: {
                cans: [agreement.budget_line_items[0].can],
                count: 1,
                limit: 10,
                offset: 0
            }
        });
        useGetUserFullNameFromId.mockReturnValue("unknown");

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <ChangeRequestList handleReviewChangeRequest={vi.mock} />
                </BrowserRouter>
            </Provider>
        );

        expect(useGetChangeRequestsListQuery).toHaveBeenCalledWith(
            { userId: 500, limit: 1000, offset: 0 },
            { refetchOnMountOrArgChange: true, skip: false }
        );

        const headings = await screen.findAllByText(/budget change/i);
        expect(headings).toHaveLength(3);
    });

    it("expands a CR with multiple change flags into separate cards", async () => {
        // A single CR with both has_budget_change and has_status_change should render two cards.
        const multiChangeCR = {
            ...changeRequests[0],
            id: 99,
            has_budget_change: true,
            has_status_change: true,
            has_proc_shop_change: false,
            created_on: "2024-06-17T22:03:15.201945",
            requested_change_diff: {
                amount: { new: 333333, old: 300000 },
                status: { new: "PLANNED", old: "DRAFT" }
            }
        };

        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: [multiChangeCR], count: 1, limit: 1000, offset: 0 }
        });
        useGetPendingPreAwardApprovalsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetPendingBudgetRequisitionsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCanByIdQuery.mockReturnValue({ data: agreement.budget_line_items[0].can, isSuccess: true });
        useGetCansQuery.mockReturnValue({ data: { cans: [agreement.budget_line_items[0].can], count: 1 } });
        useGetUserFullNameFromId.mockReturnValue("Admin Demo");

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <ChangeRequestList handleReviewChangeRequest={vi.fn()} />
                </BrowserRouter>
            </Provider>
        );

        // One CR with two flags → two cards (budget change + status change)
        const budgetHeadings = await screen.findAllByText(/budget change/i);
        expect(budgetHeadings.length).toBeGreaterThanOrEqual(1);
        const statusHeadings = await screen.findAllByText(/status change/i);
        expect(statusHeadings.length).toBeGreaterThanOrEqual(1);
    });

    it("sorts pre-award approvals and change requests together by date descending", async () => {
        // CR created on an older date; pre-award approval requested on a newer date.
        // Pre-award card should appear before the CR card in the rendered list.
        const olderCR = {
            ...changeRequests[0],
            id: 10,
            has_budget_change: true,
            has_status_change: false,
            created_on: "2023-01-01T00:00:00"
        };
        const newerPreAward = {
            id: 42,
            approval_requested_date: "2024-06-01",
            approval_requested_by: 500,
            requestor_notes: null,
            procurement_tracker: {
                agreement: {
                    id: 5,
                    agreement_total: 100000,
                    budget_line_items: []
                }
            }
        };

        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: [olderCR], count: 1, limit: 1000, offset: 0 }
        });
        useGetPendingPreAwardApprovalsQuery.mockReturnValue({
            data: [newerPreAward],
            isLoading: false,
            isError: false
        });
        useGetPendingBudgetRequisitionsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCanByIdQuery.mockReturnValue({ data: agreement.budget_line_items[0].can, isSuccess: true });
        useGetCansQuery.mockReturnValue({ data: { cans: [agreement.budget_line_items[0].can], count: 1 } });
        useGetUserFullNameFromId.mockReturnValue("Admin Demo");

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <ChangeRequestList handleReviewChangeRequest={vi.fn()} />
                </BrowserRouter>
            </Provider>
        );

        const cards = await screen.findAllByTestId(/review-card|pre-award-review-card/);
        // Pre-award card (newer) should appear before the budget-change card (older)
        expect(cards[0]).toHaveAttribute("data-cy", "pre-award-review-card");
    });

    it("clamps currentPage to totalPages when allItems shrinks after a refetch", async () => {
        // Start with 11 CRs (2 pages of 10). Then simulate a refetch that returns only 1 CR.
        // The component should reset to page 1 rather than showing an empty page.
        const makeCR = (id, date) => ({
            ...changeRequests[0],
            id,
            created_on: date,
            has_budget_change: true,
            has_status_change: false
        });
        const elevenCRs = Array.from({ length: 11 }, (_, i) =>
            makeCR(i + 1, `2024-06-${String(i + 1).padStart(2, "0")}T00:00:00`)
        );

        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: elevenCRs, count: 11, limit: 1000, offset: 0 }
        });
        useGetPendingPreAwardApprovalsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetPendingBudgetRequisitionsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCanByIdQuery.mockReturnValue({ data: agreement.budget_line_items[0].can, isSuccess: true });
        useGetCansQuery.mockReturnValue({ data: { cans: [agreement.budget_line_items[0].can], count: 1 } });
        useGetUserFullNameFromId.mockReturnValue("Admin Demo");

        const { rerender } = render(
            <Provider store={store}>
                <BrowserRouter>
                    <ChangeRequestList handleReviewChangeRequest={vi.fn()} />
                </BrowserRouter>
            </Provider>
        );

        // Navigate to page 2 via the pagination button
        const page2Btn = await screen.findByRole("button", { name: "Page 2" });
        page2Btn.click();

        // Now simulate a refetch that drops the list to 1 CR — totalPages collapses to 1
        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: [makeCR(1, "2024-06-01T00:00:00")], count: 1, limit: 1000, offset: 0 }
        });

        rerender(
            <Provider store={store}>
                <BrowserRouter>
                    <ChangeRequestList handleReviewChangeRequest={vi.fn()} />
                </BrowserRouter>
            </Provider>
        );

        // Should have clamped back to page 1 — the single remaining card is visible
        const cards = await screen.findAllByText(/budget change/i);
        expect(cards.length).toBeGreaterThanOrEqual(1);
        // Page 2 button should no longer exist
        expect(screen.queryByRole("button", { name: "Page 2" })).not.toBeInTheDocument();
    });

    it("skips change request fetch when active user is not available", () => {
        const emptyUserStore = mockStore({
            auth: {
                activeUser: null
            },
            alert: {
                isActive: false
            }
        });

        useGetChangeRequestsListQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false }); // undefined simulates unloaded
        useGetPendingPreAwardApprovalsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        useGetPendingBudgetRequisitionsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });

        render(
            <Provider store={emptyUserStore}>
                <BrowserRouter>
                    <ChangeRequestList handleReviewChangeRequest={vi.fn()} />
                </BrowserRouter>
            </Provider>
        );

        expect(useGetChangeRequestsListQuery).toHaveBeenCalledWith(
            { userId: null, limit: 1000, offset: 0 },
            { refetchOnMountOrArgChange: true, skip: true }
        );
        expect(screen.getByText(/no changes/i)).toBeInTheDocument();
    });
});
