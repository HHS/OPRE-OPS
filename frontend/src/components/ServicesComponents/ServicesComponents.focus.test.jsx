import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The real ServicesComponents and its hook. Only the editor context's data store and alerts are
// stubbed: a tiny store, so a dispatched delete really removes the SC from the list.
const store = vi.hoisted(() => {
    let state = { services_components: [] };
    const listeners = new Set();
    return {
        get: () => state,
        set: (next) => {
            state = next;
            listeners.forEach((listener) => listener());
        },
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
});
vi.mock("../Agreements/AgreementEditor/AgreementEditorContext.hooks", async () => {
    const { useSyncExternalStore } = await import("react");
    return {
        useEditAgreement: () => useSyncExternalStore(store.subscribe, store.get),
        useEditAgreementDispatch: () => (action) => {
            if (action.type === "DELETE_SERVICE_COMPONENT") {
                store.set({
                    services_components: store
                        .get()
                        .services_components.filter((sc) => sc.number !== action.payload.number)
                });
            }
            // DELETE_BUDGET_LINE_ITEM isn't exercised by this focus-restoration suite — no store
            // state tracks budget lines here, so nothing to do.
        }
    };
});
vi.mock("../../hooks/use-alert.hooks", () => ({ default: () => ({ setAlert: vi.fn() }) }));

import ServicesComponents from "./ServicesComponents";

const savedSc = (id, number) => ({
    id,
    number,
    optional: false,
    display_title: `Services Component ${number}`,
    period_start: "2043-01-01",
    period_end: "2043-12-31",
    description: "",
    created_on: "2043-01-01T00:00:00Z"
});

const renderServicesComponents = ({ nonDraftBudgetLines, allBudgetLines } = {}) =>
    render(
        <ServicesComponents
            nonDraftBudgetLines={nonDraftBudgetLines}
            allBudgetLines={allBudgetLines}
            serviceRequirementType="SEVERABLE"
            agreementId={1}
            continueBtnText="Save & Exit"
            workflow="none"
            isEditMode={true}
            setHasUnsavedChanges={vi.fn()}
            hasUnsavedChanges={false}
        />
    );

describe("ServicesComponents — keyboard focus after editing or deleting an SC (OPS-3268, WCAG 2.4.3)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // jsdom has no scrollIntoView; Edit scrolls the form into view.
        Element.prototype.scrollIntoView = vi.fn();
        store.set({ services_components: [savedSc(11, 1), savedSc(12, 2)] });
    });

    it.each([
        ["Update Services Component", "updating"],
        ["Cancel", "cancelling"]
    ])("moves focus to Add Services Component after %s, instead of dropping it to the page (%s)", async (button) => {
        const user = userEvent.setup();
        renderServicesComponents();

        await user.click(screen.getByRole("button", { name: "Edit Services Component 2" }));
        await user.click(screen.getByRole("button", { name: button }));

        expect(screen.getByRole("button", { name: "Add Services Component" })).toHaveFocus();
        expect(document.body).not.toHaveFocus();
    });

    it("moves focus to Add Services Component after deleting an empty SC with no prompt (OPS-3268 AC1)", async () => {
        const user = userEvent.setup();
        renderServicesComponents();

        await user.click(screen.getByRole("button", { name: "Delete Services Component 2" }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Delete Services Component 2" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Add Services Component" })).toHaveFocus();
    });

    it("moves focus to Add Services Component after confirming the generic delete modal (SC with only an OBE line)", async () => {
        const user = userEvent.setup();
        // An OBE line keeps the SC from being "empty" (AC1), so the generic confirm modal still
        // appears rather than the Draft/Planned choice modal (AC2/AC3 don't apply to OBE-only SCs).
        renderServicesComponents({
            allBudgetLines: [{ id: 1, status: "PLANNED", is_obe: true, services_component_id: 12 }]
        });

        await user.click(screen.getByRole("button", { name: "Delete Services Component 2" }));
        await user.click(screen.getByRole("button", { name: "Delete" }));

        expect(screen.queryByRole("button", { name: "Delete Services Component 2" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Add Services Component" })).toHaveFocus();
    });

    it.each([
        ["Delete", "deleting the budget lines too"],
        ["Keep", "keeping the budget lines unassigned"]
    ])("moves focus to Add Services Component after %s on an SC with a Planned line (%s)", async (buttonName) => {
        const user = userEvent.setup();
        renderServicesComponents({ allBudgetLines: [{ id: 1, status: "PLANNED", services_component_id: 12 }] });

        await user.click(screen.getByRole("button", { name: "Delete Services Component 2" }));
        await user.click(screen.getByRole("button", { name: buttonName }));

        expect(screen.queryByRole("button", { name: "Delete Services Component 2" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Add Services Component" })).toHaveFocus();
    });

    it("moves focus to Add Services Component after confirming the PoP warning with Continue with Updates", async () => {
        const user = userEvent.setup();
        // A non-draft line dated after every SC's PoP, so saving the edit raises the PoP warning.
        renderServicesComponents({ nonDraftBudgetLines: [{ id: 1, date_needed: "2050-06-30" }] });

        await user.click(screen.getByRole("button", { name: "Edit Services Component 2" }));
        await user.click(screen.getByRole("button", { name: "Update Services Component" }));
        await user.click(screen.getByRole("button", { name: "Continue with Updates" }));

        expect(screen.queryByRole("button", { name: "Continue with Updates" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Add Services Component" })).toHaveFocus();
    });

    it("leaves focus on the Delete button when the delete is cancelled", async () => {
        const user = userEvent.setup();
        // A budget line keeps the SC from being "empty" (AC1), so there's a modal to cancel.
        renderServicesComponents({ allBudgetLines: [{ id: 1, status: "PLANNED", services_component_id: 12 }] });
        const deleteButton = screen.getByRole("button", { name: "Delete Services Component 2" });

        await user.click(deleteButton);
        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(deleteButton).toHaveFocus();
        expect(screen.getByRole("button", { name: "Add Services Component" })).not.toHaveFocus();
    });

    it("doesn't move focus when nothing was edited or deleted", () => {
        renderServicesComponents();

        expect(document.body).toHaveFocus();
    });
});
