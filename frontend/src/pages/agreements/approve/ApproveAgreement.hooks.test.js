import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import useApproveAgreement from "./ApproveAgreement.hooks";
import { CHANGE_REQUEST_ACTION } from "../../../components/ChangeRequests/ChangeRequests.constants";

const useSelectorMock = vi.fn();
const useParamsMock = vi.fn();
const useSearchParamsMock = vi.fn();
const navigateMock = vi.fn();
const setAlertMock = vi.fn();
const reviewCRMock = vi.fn();

const useGetAgreementByIdQueryMock = vi.fn();
const useGetProcurementShopsQueryMock = vi.fn();
const useGetServicesComponentsListQueryMock = vi.fn();
const useUpdateChangeRequestMutationMock = vi.fn();
const useGetAllCansMock = vi.fn();
const useChangeRequestsForBudgetLinesMock = vi.fn();
const useChangeRequestsForProcurementShopMock = vi.fn();
const getUserFullNameFromIdMock = vi.fn();

vi.mock("react-redux", () => ({
    useSelector: (selector) => useSelectorMock(selector)
}));

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => navigateMock,
        useParams: () => useParamsMock(),
        useSearchParams: () => useSearchParamsMock()
    };
});

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: (...args) => useGetAgreementByIdQueryMock(...args),
    useGetProcurementShopsQuery: (...args) => useGetProcurementShopsQueryMock(...args),
    useGetServicesComponentsListQuery: (...args) => useGetServicesComponentsListQueryMock(...args),
    useUpdateChangeRequestMutation: (...args) => useUpdateChangeRequestMutationMock(...args)
}));

vi.mock("../../../hooks/use-alert.hooks.js", () => ({
    __esModule: true,
    default: () => ({ setAlert: setAlertMock })
}));

vi.mock("../../../hooks/useGetAllCans", () => ({
    useGetAllCans: () => useGetAllCansMock()
}));

vi.mock("../../../hooks/useChangeRequests.hooks", () => ({
    useChangeRequestsForBudgetLines: (...args) => useChangeRequestsForBudgetLinesMock(...args),
    useChangeRequestsForProcurementShop: (...args) => useChangeRequestsForProcurementShopMock(...args)
}));

vi.mock("../../../hooks/user.hooks", () => ({
    __esModule: true,
    default: (...args) => getUserFullNameFromIdMock(...args)
}));

const baseAgreement = {
    id: 1,
    name: "Agreement One",
    display_name: "AGR-001",
    is_awarded: false,
    project_officer_id: 1,
    alternate_project_officer_id: 2,
    procurement_shop: { id: 1, fee_percentage: 5, abbr: "OLD" },
    change_requests_in_review: [],
    budget_line_items: [
        {
            id: 101,
            in_review: true,
            amount: 1000,
            status: "PLANNED",
            services_component_id: 11,
            can: {
                id: 1,
                number: "CAN-001",
                active_period: 2026,
                portfolio: {
                    division: {
                        division_director_id: 1,
                        deputy_division_director_id: 2
                    }
                }
            },
            change_requests_in_review: [
                {
                    id: 9001,
                    has_status_change: true,
                    has_budget_change: false,
                    has_proc_shop_change: false,
                    requested_change_data: { status: "IN_EXECUTION" },
                    requestor_notes: "Please expedite"
                }
            ]
        }
    ]
};

describe("useApproveAgreement", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useSelectorMock.mockImplementation((selector) =>
            selector({
                auth: {
                    activeUser: {
                        id: 1,
                        roles: [{ name: "REVIEWER_APPROVER" }]
                    }
                }
            })
        );

        useParamsMock.mockReturnValue({ id: "1" });
        useSearchParamsMock.mockReturnValue([new URLSearchParams("type=status-change&to=EXECUTING")]);

        useGetAgreementByIdQueryMock.mockReturnValue({
            data: baseAgreement,
            error: null,
            isLoading: false,
            isSuccess: true
        });
        useGetProcurementShopsQueryMock.mockReturnValue({
            data: [
                { id: 1, fee_percentage: 5, abbr: "OLD" },
                { id: 2, fee_percentage: 7, abbr: "NEW" }
            ]
        });
        useGetServicesComponentsListQueryMock.mockReturnValue({
            data: [{ id: 11, number: 1 }]
        });
        reviewCRMock.mockReturnValue({ unwrap: () => Promise.resolve({ ok: true }) });
        useUpdateChangeRequestMutationMock.mockReturnValue([reviewCRMock]);

        useGetAllCansMock.mockReturnValue({ cans: [{ id: 1, number: "CAN-001", active_period: 2026 }] });
        useChangeRequestsForBudgetLinesMock.mockReturnValue("Budget change msg");
        useChangeRequestsForProcurementShopMock.mockReturnValue("Proc shop msg");
        getUserFullNameFromIdMock.mockReturnValue("Alex Reviewer");
    });

    it("builds executing status title and checkbox text from URL params", () => {
        const { result } = renderHook(() => useApproveAgreement());

        expect(result.current.title).toBe("Approval for Status Change - Executing");
        expect(result.current.checkBoxText).toContain("start the Procurement Process");
        expect(result.current.hasPermissionToViewPage).toBe(true);
    });

    it("uses budget-change checkbox messaging", () => {
        useSearchParamsMock.mockReturnValue([new URLSearchParams("type=budget-change")]);
        const { result } = renderHook(() => useApproveAgreement());

        expect(result.current.changeRequestType).toBe("budget-change");
        expect(result.current.checkBoxText).toContain("affect my CANs balance");
    });

    it("opens cancel modal and navigates on confirm", () => {
        const { result } = renderHook(() => useApproveAgreement());

        act(() => {
            result.current.handleCancel();
        });

        expect(result.current.showModal).toBe(true);
        expect(result.current.modalProps.heading).toContain("exit the review process");

        act(() => {
            result.current.modalProps.handleConfirm();
        });

        expect(navigateMock).toHaveBeenCalledWith("/agreements?filter=change-requests");
    });

    it("approves executing status change requests and sets success alert", async () => {
        const { result } = renderHook(() => useApproveAgreement());

        act(() => {
            result.current.setNotes("Looks good");
            result.current.handleApproveChangeRequests(CHANGE_REQUEST_ACTION.APPROVE);
        });

        expect(result.current.showModal).toBe(true);
        expect(result.current.modalProps.actionButtonText).toBe("Approve");

        await act(async () => {
            result.current.modalProps.handleConfirm();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(reviewCRMock).toHaveBeenCalledWith({
            change_request_id: 9001,
            action: "APPROVE",
            reviewer_notes: ""
        });
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                heading: "Changes Approved"
            })
        );
    });
});
