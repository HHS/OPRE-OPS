import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupStore } from "../../../store";
import { StartModification } from "./StartModification";
import useStartModification from "./StartModification.hooks";

/** True for a DisabledButtonWithTooltip: a disabled button inside a focusable, aria-disabled wrapper. */
const isDisabledWithReachableTooltip = (name) => {
    const matches = screen.getAllByRole("button", { name });
    const button = matches.find((el) => el.tagName === "BUTTON");
    const wrapper = matches.find((el) => el.tagName === "DIV");
    return (
        Boolean(button?.disabled) &&
        wrapper?.getAttribute("tabindex") === "0" &&
        wrapper?.getAttribute("aria-disabled") === "true"
    );
};

vi.mock("./StartModification.hooks", async (importOriginal) => ({
    ...(await importOriginal()),
    default: vi.fn()
}));

// App's Breadcrumb needs a data router; stub it to a passthrough.
vi.mock("../../../App", () => ({
    default: ({ children }) => <div>{children}</div>
}));

const baseHookReturn = {
    agreement: { id: 42, name: "Awarded Contract", is_awarded: true, _meta: { isEditable: true } },
    errorAgreement: null,
    isPageReady: true,
    canStartModification: true,
    servicesComponents: [],
    edits: [],
    budgetLines: [],
    groupedBudgetLinesByServicesComponent: [],
    selectedBudgetLines: [],
    handleSelectBLI: vi.fn(),
    toggleSelectActionableBLIs: vi.fn(),
    toggleStates: {},
    setToggleStates: vi.fn(),
    afterApproval: true,
    setAfterApproval: vi.fn(),
    notes: "",
    setNotes: vi.fn(),
    isSubmissionReady: false,
    handleSendToApproval: vi.fn(),
    projectOfficerName: "Officer",
    alternateProjectOfficerName: "",
    showModal: false,
    setShowModal: vi.fn(),
    handleCancel: vi.fn(),
    confirmCancel: vi.fn()
};

const renderPage = (overrides = {}) => {
    useStartModification.mockReturnValue({ ...baseHookReturn, ...overrides });
    return render(
        <Provider store={setupStore()}>
            <MemoryRouter initialEntries={["/agreements/42/start-modification"]}>
                <Routes>
                    <Route
                        path="/agreements/:id/start-modification"
                        element={<StartModification />}
                    />
                    <Route
                        path="/agreements/:id/award-modifications"
                        element={<div>Award & Modifications tab</div>}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
};

describe("StartModification", () => {
    beforeEach(() => vi.clearAllMocks());

    it("summarizes a Services Component addition among the edits to modify", () => {
        renderPage({
            edits: [
                {
                    id: 5,
                    modification_type: "MODIFIED_LOE",
                    budget_line_item_id: null,
                    services_component_id: 31,
                    field: "services_component_create",
                    old_value: null,
                    new_value: "OSC3",
                    requested_by: { id: 1, full_name: "First Last Name" },
                    requested_on: "2026-10-01T00:00:00Z"
                }
            ]
        });

        expect(screen.getByText("OSC3")).toBeInTheDocument();
        expect(screen.getByText("Add SC")).toBeInTheDocument();
        expect(screen.queryByText("BL ID")).not.toBeInTheDocument();
    });

    it("disables Send to Approval until there is something to modify", () => {
        renderPage();

        expect(screen.getByRole("heading", { name: "Start Modification" })).toBeInTheDocument();
        expect(isDisabledWithReachableTooltip("Send to Approval")).toBe(true);
    });

    it("sends to approval when ready", async () => {
        const handleSendToApproval = vi.fn();
        renderPage({ isSubmissionReady: true, handleSendToApproval });

        await userEvent.click(screen.getByRole("button", { name: "Send to Approval" }));

        expect(handleSendToApproval).toHaveBeenCalled();
    });

    it("returns to the Award & Modifications tab when a modification can't be started", () => {
        renderPage({ canStartModification: false });

        expect(screen.getByText("Award & Modifications tab")).toBeInTheDocument();
    });
});
