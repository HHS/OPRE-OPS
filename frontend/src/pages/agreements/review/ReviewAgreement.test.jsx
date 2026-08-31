import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { setupStore } from "../../../store";
import { ReviewAgreement } from "./ReviewAgreement";
import useReviewAgreement from "./ReviewAgreement.hooks";
import { POP_RANGE_ERROR_KEY } from "./suite";

vi.mock("./ReviewAgreement.hooks");

// App wraps everything including Breadcrumb which calls useMatches — that hook
// requires a data router and throws under MemoryRouter. Stub it to a passthrough.
vi.mock("../../../App", () => ({
    default: ({ children }) => <div>{children}</div>
}));

const baseHookReturn = {
    action: "",
    submitButtonText: "Submit",
    appliesImmediately: false,
    handleSelectBLI: vi.fn(),
    pageErrors: {},
    isAlertActive: false,
    setIsAlertActive: vi.fn(),
    agreementValidationResults: null,
    handleActionChange: vi.fn(),
    toggleSelectActionableBLIs: vi.fn(),
    notes: "",
    setNotes: vi.fn(),
    servicesComponents: [],
    grantNumbers: [],
    isGrant: false,
    groupedBudgetLinesByServicesComponent: [],
    handleSendToApproval: vi.fn(),
    hasBLIError: false,
    isAgreementAwarded: false,
    isSubmissionReady: false,
    changeRequestAction: undefined,
    anyBudgetLinesDraft: false,
    anyBudgetLinePlanned: false,
    errorAgreement: null,
    isLoadingAgreement: false,
    isAgreementEditable: true,
    projectOfficerName: "Officer Name",
    alternateProjectOfficerName: "",
    afterApproval: true,
    setAfterApproval: vi.fn(),
    agreement: {
        id: 1,
        name: "Test Agreement",
        _meta: { isEditable: true }
    },
    toggleStates: {},
    setToggleStates: vi.fn(),
    selectedBudgetLines: [],
    changeTo: { status: { new: "PLANNED", old: "DRAFT" } },
    handleCancel: vi.fn(),
    showModal: false,
    setShowModal: vi.fn(),
    modalProps: {
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: vi.fn()
    }
};

const renderComponent = (overrides = {}) => {
    useReviewAgreement.mockReturnValue({ ...baseHookReturn, ...overrides });
    return render(
        <Provider store={setupStore()}>
            <MemoryRouter initialEntries={["/agreements/review/1"]}>
                <Routes>
                    <Route
                        path="/agreements/review/:id"
                        element={<ReviewAgreement />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
};

describe("ReviewAgreement error banner", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders a single <li> for the POP_RANGE_ERROR_KEY key", () => {
        renderComponent({
            isAlertActive: true,
            pageErrors: {
                [POP_RANGE_ERROR_KEY]: ["Budget Line Obligate By"]
            }
        });

        const errorList = screen.getByRole("list", { hidden: true });
        const errorItems = within(errorList).getAllByRole("listitem");
        expect(errorItems).toHaveLength(1);
        expect(errorItems[0]).toHaveAttribute("data-cy", "error-item");
        expect(errorItems[0]).toHaveTextContent("Obligate By Date Outside Period of Performance");
    });

    it("renders a single <li> for each non-POP_RANGE_ERROR_KEY error key", () => {
        renderComponent({
            isAlertActive: true,
            pageErrors: { cor: ["COR is required"], amount: ["Amount is required"] }
        });

        const errorList = screen.getByRole("list", { hidden: true });
        const errorItems = within(errorList).getAllByRole("listitem");
        expect(errorItems).toHaveLength(2);
        errorItems.forEach((item) => expect(item).toHaveAttribute("data-cy", "error-item"));
    });

    it("renders both POP_RANGE and other error types together", () => {
        renderComponent({
            isAlertActive: true,
            pageErrors: {
                cor: ["COR is required"],
                [POP_RANGE_ERROR_KEY]: ["Budget Line Obligate By"]
            }
        });

        const errorList = screen.getByRole("list", { hidden: true });
        const errorItems = within(errorList).getAllByRole("listitem");
        // 1 for cor + 1 for POP_RANGE_ERROR_KEY
        expect(errorItems).toHaveLength(2);
    });

    it("does not render the error banner when isAlertActive is false", () => {
        renderComponent({
            isAlertActive: false,
            pageErrors: { [POP_RANGE_ERROR_KEY]: ["BL 101: date out of range"] }
        });

        expect(screen.queryByRole("list", { hidden: true })).toBeNull();
    });
});

/* eslint-disable testing-library/no-node-access */
// The error border lives on the accordion heading (h3); reach it from the heading button.
describe("ReviewAgreement unassociated services component error border", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const makeBudgetLine = (selected) => ({
        id: 16096,
        status: "DRAFT",
        actionable: true,
        selected,
        in_review: false,
        amount: 112233,
        fees: 0,
        total: 112233,
        date_needed: "2026-08-31",
        services_component_id: null,
        services_component_number: 0,
        can: { number: "G994426" }
    });

    const unassociatedGroup = (selected) => [
        {
            serviceComponentGroupingLabel: "0",
            servicesComponentNumber: 0,
            budgetLines: [makeBudgetLine(selected)]
        }
    ];

    const getUnassociatedHeading = () =>
        screen
            .getByRole("button", { name: /BLs not associated with a Services Component/ })
            .closest(".usa-accordion__heading");

    it("adds the red error border to the unassociated accordion heading when a BL in it is selected", () => {
        renderComponent({
            groupedBudgetLinesByServicesComponent: unassociatedGroup(true)
        });

        const heading = getUnassociatedHeading();
        expect(heading).toHaveClass("border-2px");
        expect(heading).toHaveClass("border-secondary-dark");
    });

    it("does not add the error border to the unassociated accordion heading when no BL in it is selected", () => {
        renderComponent({
            groupedBudgetLinesByServicesComponent: unassociatedGroup(false)
        });

        const heading = getUnassociatedHeading();
        expect(heading).not.toHaveClass("border-2px");
        expect(heading).not.toHaveClass("border-secondary-dark");
    });
});

describe("ReviewAgreement CLIN column", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const clinGroup = [
        {
            serviceComponentGroupingLabel: "1",
            servicesComponentNumber: 1,
            budgetLines: [
                {
                    id: 200,
                    status: "PLANNED",
                    actionable: true,
                    selected: false,
                    in_review: false,
                    amount: 1000,
                    fees: 0,
                    total: 1000,
                    date_needed: "2044-06-01",
                    services_component_id: 1,
                    services_component_number: 1,
                    can: { number: "G994426" },
                    clin: { id: 9, number: 42 }
                }
            ]
        }
    ];

    const contractAgreement = {
        id: 1,
        name: "Test Agreement",
        agreement_type: "CONTRACT",
        _meta: { isEditable: true }
    };

    it("shows the CLIN column for an awarded contract agreement", () => {
        renderComponent({
            isAgreementAwarded: true,
            agreement: contractAgreement,
            groupedBudgetLinesByServicesComponent: clinGroup
        });

        expect(screen.getByText("CLIN")).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "42" })).toBeInTheDocument();
    });

    it("hides the CLIN column for an awarded non-contract agreement", () => {
        renderComponent({
            isAgreementAwarded: true,
            agreement: { ...contractAgreement, agreement_type: "IAA" },
            groupedBudgetLinesByServicesComponent: clinGroup
        });

        expect(screen.queryByText("CLIN")).not.toBeInTheDocument();
    });

    it("hides the CLIN column for a contract agreement that is not awarded", () => {
        renderComponent({
            isAgreementAwarded: false,
            agreement: contractAgreement,
            groupedBudgetLinesByServicesComponent: clinGroup
        });

        expect(screen.queryByText("CLIN")).not.toBeInTheDocument();
    });
});
