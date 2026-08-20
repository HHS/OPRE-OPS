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

    it("renders one <li> per POP_RANGE_ERROR_KEY message when multiple BLs violate the PoP window", () => {
        const popMessages = [
            "BL 101: Obligate By Date must be within PoP",
            "BL 202: Obligate By Date must be within PoP",
            "BL 303: Obligate By Date must be within PoP"
        ];

        renderComponent({
            isAlertActive: true,
            pageErrors: { [POP_RANGE_ERROR_KEY]: popMessages }
        });

        const errorList = screen.getByRole("list", { hidden: true });
        const errorItems = within(errorList).getAllByRole("listitem");
        expect(errorItems).toHaveLength(3);
        popMessages.forEach((msg, i) => {
            expect(errorItems[i]).toHaveTextContent(msg);
            expect(errorItems[i]).toHaveAttribute("data-cy", "error-item");
        });
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
                [POP_RANGE_ERROR_KEY]: ["BL 101: date out of range", "BL 202: date out of range"]
            }
        });

        const errorList = screen.getByRole("list", { hidden: true });
        const errorItems = within(errorList).getAllByRole("listitem");
        // 1 for cor + 2 for POP_RANGE_ERROR_KEY
        expect(errorItems).toHaveLength(3);
    });

    it("does not render the error banner when isAlertActive is false", () => {
        renderComponent({
            isAlertActive: false,
            pageErrors: { [POP_RANGE_ERROR_KEY]: ["BL 101: date out of range"] }
        });

        expect(screen.queryByRole("list", { hidden: true })).toBeNull();
    });
});
