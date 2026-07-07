import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupStore } from "../../../store";
import useRequestPreAwardApproval from "./RequestPreAwardApproval.hooks";

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: vi.fn(),
    useGetServicesComponentsListQuery: vi.fn(),
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

vi.mock("react-router-dom", async (importOriginal) => {
    /** @type {any} */
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useBlocker: () => ({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() })
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
