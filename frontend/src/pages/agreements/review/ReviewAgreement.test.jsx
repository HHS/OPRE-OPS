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

    it("renders a single <li> for the POP_RANGE_ERROR_KEY key no matter how many BLs violate the PoP window", () => {
        renderComponent({
            isAlertActive: true,
            pageErrors: {
                [POP_RANGE_ERROR_KEY]: ["Budget Line Obligate By", "Budget Line Obligate By", "Budget Line Obligate By"]
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
