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

const renderServicesComponents = ({ nonDraftBudgetLines } = {}) =>
    render(
        <ServicesComponents
            nonDraftBudgetLines={nonDraftBudgetLines}
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

    it("moves focus to Add Services Component after a confirmed delete removes the focused item", async () => {
        const user = userEvent.setup();
        renderServicesComponents();

        await user.click(screen.getByRole("button", { name: "Delete Services Component 2" }));
        await user.click(screen.getByRole("button", { name: "Delete" }));

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
        renderServicesComponents();
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
