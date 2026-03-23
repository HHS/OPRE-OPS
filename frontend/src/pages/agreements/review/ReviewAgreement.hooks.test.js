import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useReviewAgreement from "./ReviewAgreement.hooks";
import { actionOptions } from "./ReviewAgreement.constants";

const navigateMock = vi.fn();
const setAlertMock = vi.fn();
const updateBudgetLineItemMock = vi.fn();
const useGetAgreementByIdQueryMock = vi.fn();
const useGetServicesComponentsListQueryMock = vi.fn();
const useUpdateBudgetLineItemMutationMock = vi.fn();
const getUserFullNameFromIdMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => navigateMock
    };
});

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: (...args) => useGetAgreementByIdQueryMock(...args),
    useGetServicesComponentsListQuery: (...args) => useGetServicesComponentsListQueryMock(...args),
    useUpdateBudgetLineItemMutation: (...args) => useUpdateBudgetLineItemMutationMock(...args)
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: setAlertMock })
}));

vi.mock("../../../hooks/user.hooks", () => ({
    __esModule: true,
    default: (...args) => getUserFullNameFromIdMock(...args)
}));

const futureDate = () => {
    const value = new Date();
    value.setDate(value.getDate() + 5);
    return value.toISOString().slice(0, 10);
};

const makeAgreement = (overrides = {}) => ({
    id: 77,
    name: "Agreement Alpha",
    agreement_type: "CONTRACT",
    description: "Review agreement coverage",
    product_service_code: { name: "PSC" },
    procurement_shop: { abbr: "OPS" },
    agreement_reason: "NEW_REQ",
    project_officer_id: 11,
    alternate_project_officer_id: 22,
    contract_type: "Firm Fixed Price",
    team_members: [{ id: 1 }],
    is_awarded: false,
    _meta: { isEditable: true },
    budget_line_items: [
        {
            id: 101,
            amount: 1500,
            can_id: "CAN-001",
            services_component_id: 1,
            date_needed: futureDate(),
            status: "DRAFT",
            in_review: false
        },
        {
            id: 202,
            amount: 800,
            can_id: "CAN-002",
            services_component_id: 2,
            date_needed: futureDate(),
            status: "PLANNED",
            in_review: false
        },
        {
            id: 303,
            amount: 400,
            can_id: "CAN-003",
            services_component_id: 2,
            date_needed: futureDate(),
            status: "DRAFT",
            in_review: true
        }
    ],
    ...overrides
});

describe("useReviewAgreement", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useGetAgreementByIdQueryMock.mockReturnValue({
            isSuccess: true,
            data: makeAgreement(),
            error: null,
            isLoading: false
        });
        useGetServicesComponentsListQueryMock.mockReturnValue({
            data: [
                { id: 1, number: 1 },
                { id: 2, number: 2, sub_component: "A" }
            ]
        });
        updateBudgetLineItemMock.mockReturnValue({
            unwrap: () => Promise.resolve({ ok: true })
        });
        useUpdateBudgetLineItemMutationMock.mockReturnValue([updateBudgetLineItemMock]);
        getUserFullNameFromIdMock.mockImplementation((id) => `User ${id}`);
    });

    it("builds grouped budget lines and marks only eligible rows actionable", async () => {
        const { result } = renderHook(() => useReviewAgreement(77));

        await waitFor(() => {
            expect(result.current.groupedBudgetLinesByServicesComponent).toHaveLength(2);
        });

        expect(result.current.projectOfficerName).toBe("User 11");
        expect(result.current.alternateProjectOfficerName).toBe("User 22");
        expect(result.current.anyBudgetLinesDraft).toBe(true);
        expect(result.current.anyBudgetLinePlanned).toBe(true);

        act(() => {
            result.current.handleActionChange(actionOptions.CHANGE_DRAFT_TO_PLANNED);
        });

        const draftGroup = result.current.groupedBudgetLinesByServicesComponent.find(
            (group) => group.servicesComponentNumber === 1
        );
        const plannedGroup = result.current.groupedBudgetLinesByServicesComponent.find(
            (group) => group.servicesComponentNumber === 2
        );

        expect(draftGroup.budgetLines[0]).toMatchObject({ id: 101, actionable: true, selected: false });
        expect(plannedGroup.budgetLines[0]).toMatchObject({ id: 202, actionable: false, selected: false });
        expect(plannedGroup.budgetLines[1]).toMatchObject({ id: 303, actionable: false, selected: false });

        act(() => {
            result.current.toggleSelectActionableBLIs(1);
        });

        expect(result.current.toggleStates[1]).toBe(true);
        expect(result.current.selectedBudgetLines.map((item) => item.id)).toEqual([101]);
        expect(result.current.isSubmissionReady).toBe(true);
        expect(result.current.changeRequestAction).toBe("DRAFT_TO_PLANNED");
        expect(result.current.changeTo.status).toEqual({ new: "PLANNED", old: "DRAFT" });
    });

    it("aggregates agreement and budget line validation errors after selecting a row", async () => {
        useGetAgreementByIdQueryMock.mockReturnValue({
            isSuccess: true,
            data: makeAgreement({
                project_officer_id: 0,
                budget_line_items: [
                    {
                        id: 101,
                        amount: 0,
                        can_id: "",
                        services_component_id: "",
                        date_needed: "",
                        status: "DRAFT",
                        in_review: false
                    }
                ]
            }),
            error: null,
            isLoading: false
        });

        const { result } = renderHook(() => useReviewAgreement(77));

        act(() => {
            result.current.handleActionChange(actionOptions.CHANGE_DRAFT_TO_PLANNED);
            result.current.handleSelectBLI(101);
        });

        await waitFor(() => {
            expect(result.current.isAlertActive).toBe(true);
        });

        expect(result.current.pageErrors).toHaveProperty("cor");
        expect(result.current.pageErrors).toHaveProperty("Budget Line Amount");
        expect(result.current.pageErrors).toHaveProperty("Budget Line CAN");
        expect(result.current.hasBLIError).toBe(true);
        expect(result.current.isSubmissionReady).toBe(true);
    });

    it("submits selected budget lines for approval and sets a success alert", async () => {
        const { result } = renderHook(() => useReviewAgreement(77));

        act(() => {
            result.current.handleActionChange(actionOptions.CHANGE_DRAFT_TO_PLANNED);
            result.current.handleSelectBLI(101);
            result.current.setNotes("Ready for review");
        });

        await waitFor(() => {
            expect(result.current.selectedBudgetLines.map((item) => item.id)).toEqual([101]);
        });

        act(() => {
            result.current.handleSendToApproval();
        });

        await waitFor(() => {
            expect(updateBudgetLineItemMock).toHaveBeenCalledWith({
                id: 101,
                data: {
                    status: "PLANNED",
                    requestor_notes: "Ready for review"
                }
            });
        });

        await waitFor(() => {
            expect(setAlertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "success",
                    heading: "Changes Sent to Approval",
                    redirectUrl: "/agreements"
                })
            );
        });
    });

    it("shows an error alert when any budget line update fails", async () => {
        updateBudgetLineItemMock.mockReturnValueOnce({
            unwrap: () => Promise.reject(new Error("save failed"))
        });

        const { result } = renderHook(() => useReviewAgreement(77));

        act(() => {
            result.current.handleActionChange(actionOptions.CHANGE_DRAFT_TO_PLANNED);
            result.current.handleSelectBLI(101);
        });

        await waitFor(() => {
            expect(result.current.selectedBudgetLines.map((item) => item.id)).toEqual([101]);
        });

        act(() => {
            result.current.handleSendToApproval();
        });

        await waitFor(() => {
            expect(setAlertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "error",
                    heading: "Error Sending Agreement Edits",
                    redirectUrl: "/error"
                })
            );
        });
    });

    it("opens the cancel modal and navigates on confirm", async () => {
        const { result } = renderHook(() => useReviewAgreement(77));

        act(() => {
            result.current.handleCancel();
        });

        expect(result.current.showModal).toBe(true);
        expect(result.current.modalProps.heading).toContain("cancel this status change");

        act(() => {
            result.current.modalProps.handleConfirm();
        });

        expect(navigateMock).toHaveBeenCalledWith("/agreements");
    });
});
