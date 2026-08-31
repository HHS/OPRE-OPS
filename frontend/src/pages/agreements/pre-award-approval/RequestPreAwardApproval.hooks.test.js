import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupStore } from "../../../store";
import useRequestPreAwardApproval from "./RequestPreAwardApproval.hooks";
import { POP_RANGE_ERROR_KEY } from "./suite";

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: vi.fn(),
    useGetServicesComponentsListQuery: vi.fn(),
    useGetGrantNumbersListQuery: vi.fn(() => ({ data: [] })),
    useGetDocumentsByAgreementIdQuery: vi.fn(),
    useGetProcurementTrackersByAgreementIdQuery: vi.fn(),
    useUpdateProcurementTrackerStepMutation: vi.fn(),
    useAddDocumentMutation: vi.fn(),
    useUpdateDocumentStatusMutation: vi.fn()
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: vi.fn(() => "Some Person")
}));

vi.mock("../../../helpers/budgetLines.helpers", async (importOriginal) => {
    /** @type {any} */
    const actual = await importOriginal();
    return {
        ...actual,
        groupByServicesComponent: vi.fn(() => []),
        budgetLinesTotal: vi.fn(() => 0)
    };
});

const mockUseBlocker = vi.fn(() => ({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() }));
const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
    /** @type {any} */
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => navigateMock,
        useBlocker: (...args) => mockUseBlocker(...args)
    };
});

import {
    useAddDocumentMutation,
    useGetAgreementByIdQuery,
    useGetDocumentsByAgreementIdQuery,
    useGetProcurementTrackersByAgreementIdQuery,
    useGetServicesComponentsListQuery,
    useUpdateDocumentStatusMutation,
    useUpdateProcurementTrackerStepMutation
} from "../../../api/opsAPI";

const futureDateISO = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
};

const buildAgreement = (overrides = {}) => ({
    id: 1,
    name: "Test Agreement",
    agreement_type: "CONTRACT",
    description: "Something to procure",
    product_service_code: { name: "PSC 42" },
    procurement_shop: { abbr: "GCS" },
    agreement_reason: "NEW_REQ",
    project_officer_id: 42,
    contract_type: "FIRM_FIXED_PRICE",
    team_members: [{ id: 1 }],
    budget_line_items: [
        {
            id: 100,
            status: "PLANNED",
            amount: 5000,
            can_id: 7,
            services_component_id: 3,
            date_needed: futureDateISO()
        }
    ],
    _meta: { isEditable: true },
    ...overrides
});

const buildTrackerData = (step4Status = "COMPLETED") => ({
    data: [
        {
            status: "ACTIVE",
            steps: [
                { step_number: 4, status: step4Status },
                { step_number: 5, id: 5, approval_requested: false, approval_status: null }
            ]
        }
    ]
});

const wrapperFor = (store) => {
    const Wrapper = ({ children }) => (
        <Provider store={store}>
            <MemoryRouter>{children}</MemoryRouter>
        </Provider>
    );
    Wrapper.displayName = "TestWrapper";
    return Wrapper;
};

const setup = (agreement, trackerData = buildTrackerData()) => {
    useGetAgreementByIdQuery.mockReturnValue({ data: agreement, isLoading: false });
    useGetServicesComponentsListQuery.mockReturnValue({ data: [] });
    useGetDocumentsByAgreementIdQuery.mockReturnValue({ data: { documents: [] } });
    useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({ data: trackerData });
    useUpdateProcurementTrackerStepMutation.mockReturnValue([vi.fn(), {}]);
    useAddDocumentMutation.mockReturnValue([vi.fn(), {}]);
    useUpdateDocumentStatusMutation.mockReturnValue([vi.fn(), {}]);
    const store = setupStore({ auth: { activeUser: null } });
    return renderHook(() => useRequestPreAwardApproval(1), { wrapper: wrapperFor(store) });
};

describe("useRequestPreAwardApproval — navigation blocker", () => {
    let mockProceed;
    let mockReset;

    beforeEach(() => {
        vi.clearAllMocks();
        mockProceed = vi.fn();
        mockReset = vi.fn();
        mockUseBlocker.mockReturnValue({ state: "unblocked", proceed: mockProceed, reset: mockReset });
    });

    it("does not block navigation when form is clean", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: mockProceed, reset: mockReset };
        });
        const { result } = setup(buildAgreement());
        await waitFor(() => expect(result.current).toBeDefined());
        const shouldBlock = capturedCb({
            currentLocation: { pathname: "/agreements/1/pre-award" },
            nextLocation: { pathname: "/agreements/1/details" }
        });
        expect(shouldBlock).toBe(false);
    });

    it("blocks navigation when form has changes", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: mockProceed, reset: mockReset };
        });
        const { result } = setup(buildAgreement());
        await waitFor(() => expect(result.current).toBeDefined());
        result.current.setNotes("some note");
        await waitFor(() => {
            const shouldBlock = capturedCb({
                currentLocation: { pathname: "/agreements/1/pre-award" },
                nextLocation: { pathname: "/agreements/1/details" }
            });
            expect(shouldBlock).toBe(true);
        });
    });

    it("bypasses the blocker and navigates to the edit page on handleEdit", async () => {
        let capturedCb;
        mockUseBlocker.mockImplementation((cb) => {
            capturedCb = cb;
            return { state: "unblocked", proceed: mockProceed, reset: mockReset };
        });
        const { result } = setup(buildAgreement());
        await waitFor(() => expect(result.current).toBeDefined());

        // Typed notes -> hasChanged=true, so the blocker would fire on navigation.
        act(() => {
            result.current.setNotes("some note");
        });

        const nav = {
            currentLocation: { pathname: "/agreements/1/pre-award-approval" },
            nextLocation: { pathname: "/agreements/review/1/edit" }
        };

        // BEFORE handleEdit: predicate blocks (isNavigating=false).
        await waitFor(() => expect(capturedCb(nav)).toBe(true));

        // handleEdit sets the isNavigating bypass then navigates to the edit form.
        act(() => {
            result.current.handleEdit();
        });

        // AFTER handleEdit: the bypass is set so the predicate no longer blocks, and
        // navigate got the encoded returnTo URL. NOTE: with useBlocker mocked, this
        // guards the bypass-flag contract and the URL — but not the flushSync timing
        // itself (react-router's synchronous re-check on a real forward push is what
        // requires flushSync; that is only observable with a real router, not here).
        expect(capturedCb(nav)).toBe(false);
        expect(navigateMock).toHaveBeenCalledWith(
            "/agreements/review/1/edit?returnTo=%2Fagreements%2F1%2Fpre-award-approval"
        );
    });

    it("shows correct copy when blocker fires", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });
        const { result } = setup(buildAgreement());
        await waitFor(() => {
            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.heading).toBe(
                "Are you sure you want to cancel your pre-award request? Your progress will not be saved."
            );
            expect(result.current.modalProps.actionButtonText).toBe("Cancel Pre-Award");
            expect(result.current.modalProps.secondaryButtonText).toBe("Continue editing");
        });
    });

    it("proceeds with navigation and hides modal on handleConfirm", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });
        const { result } = setup(buildAgreement());
        await waitFor(() => expect(result.current.showModal).toBe(true));
        result.current.modalProps.handleConfirm();
        await waitFor(() => {
            expect(result.current.showModal).toBe(false);
            expect(mockProceed).toHaveBeenCalled();
            expect(mockReset).not.toHaveBeenCalled();
        });
    });

    it("resets blocker and hides modal on closeModal", async () => {
        mockUseBlocker.mockReturnValue({ state: "blocked", proceed: mockProceed, reset: mockReset });
        const { result } = setup(buildAgreement());
        await waitFor(() => expect(result.current.showModal).toBe(true));
        result.current.modalProps.closeModal();
        await waitFor(() => {
            expect(result.current.showModal).toBe(false);
            expect(mockReset).toHaveBeenCalled();
            expect(mockProceed).not.toHaveBeenCalled();
        });
    });
});

describe("useRequestPreAwardApproval — validation wiring", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("reports no validation errors when the agreement and PLANNED BLI are fully populated", async () => {
        const { result } = setup(buildAgreement());
        await waitFor(() => expect(result.current).toBeDefined());
        expect(result.current.pageErrors).toEqual({});
        expect(result.current.isAlertActive).toBe(false);
        expect(result.current.hasBLIError).toBe(false);
    });

    it("surfaces agreement-level errors in pageErrors when a required field is missing", async () => {
        const { result } = setup(buildAgreement({ name: "" }));
        await waitFor(() => expect(result.current).toBeDefined());
        expect(Object.keys(result.current.pageErrors)).toContain("name");
        expect(result.current.isAlertActive).toBe(true);
    });

    it("remaps project-officer errors to cor for CONTRACT agreements", async () => {
        const { result } = setup(buildAgreement({ project_officer_id: 0 }));
        await waitFor(() => expect(result.current).toBeDefined());
        expect(Object.keys(result.current.pageErrors)).toContain("cor");
        expect(Object.keys(result.current.pageErrors)).not.toContain("project-officer");
    });

    it("flags a PLANNED BLI with a missing CAN as an error", async () => {
        const agreement = buildAgreement({
            budget_line_items: [
                {
                    id: 100,
                    status: "PLANNED",
                    amount: 5000,
                    can_id: null,
                    services_component_id: 3,
                    date_needed: futureDateISO()
                }
            ]
        });
        const { result } = setup(agreement);
        await waitFor(() => expect(result.current).toBeDefined());
        expect(result.current.hasBLIError).toBe(true);
        expect(result.current.isAlertActive).toBe(true);
    });

    it("flags an IN_EXECUTION BLI with a missing CAN as an error", async () => {
        const agreement = buildAgreement({
            budget_line_items: [
                {
                    id: 200,
                    status: "IN_EXECUTION",
                    amount: 5000,
                    can_id: null,
                    services_component_id: 3,
                    date_needed: futureDateISO()
                }
            ]
        });
        const { result } = setup(agreement);
        await waitFor(() => expect(result.current).toBeDefined());
        expect(result.current.hasBLIError).toBe(true);
    });

    it("does NOT flag a DRAFT BLI even when required fields are missing", async () => {
        const agreement = buildAgreement({
            budget_line_items: [
                {
                    id: 300,
                    status: "DRAFT",
                    amount: 0,
                    can_id: null,
                    services_component_id: 0,
                    date_needed: null
                }
            ]
        });
        const { result } = setup(agreement);
        await waitFor(() => expect(result.current).toBeDefined());
        expect(result.current.hasBLIError).toBe(false);
    });

    it("does NOT flag an OBLIGATED BLI with missing fields", async () => {
        const agreement = buildAgreement({
            budget_line_items: [
                {
                    id: 400,
                    status: "OBLIGATED",
                    amount: 0,
                    can_id: null,
                    services_component_id: 0,
                    date_needed: null
                }
            ]
        });
        const { result } = setup(agreement);
        await waitFor(() => expect(result.current).toBeDefined());
        expect(result.current.hasBLIError).toBe(false);
    });

    it("shows a single POP-range message no matter how many BLs violate it", async () => {
        const isoDaysFromNow = (days) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return d.toISOString().slice(0, 10);
        };

        const agreement = buildAgreement({
            budget_line_items: [
                {
                    id: 101,
                    status: "PLANNED",
                    amount: 1500,
                    can_id: 1,
                    services_component_id: 1,
                    date_needed: isoDaysFromNow(2), // before PoP start
                    sc_period_start: isoDaysFromNow(10),
                    sc_period_end: isoDaysFromNow(100)
                },
                {
                    id: 102,
                    status: "IN_EXECUTION",
                    amount: 800,
                    can_id: 1,
                    services_component_id: 1,
                    date_needed: isoDaysFromNow(200), // after PoP end
                    sc_period_start: isoDaysFromNow(10),
                    sc_period_end: isoDaysFromNow(100)
                }
            ]
        });

        const { result } = setup(agreement);
        await waitFor(() => expect(result.current.isAlertActive).toBe(true));

        expect(result.current.pageErrors[POP_RANGE_ERROR_KEY]).toEqual(["Budget Line Obligate By"]);
    });

    it("exposes the filtered validatable budget lines list", async () => {
        const agreement = buildAgreement({
            budget_line_items: [
                { id: 1, status: "DRAFT" },
                {
                    id: 2,
                    status: "PLANNED",
                    amount: 100,
                    can_id: 1,
                    services_component_id: 1,
                    date_needed: futureDateISO()
                },
                {
                    id: 3,
                    status: "IN_EXECUTION",
                    amount: 100,
                    can_id: 1,
                    services_component_id: 1,
                    date_needed: futureDateISO()
                },
                { id: 4, status: "OBLIGATED" }
            ]
        });
        const { result } = setup(agreement);
        await waitFor(() => expect(result.current).toBeDefined());
        const ids = result.current.validatableBudgetLines.map((b) => b.id).sort();
        expect(ids).toEqual([2, 3]);
    });
});
