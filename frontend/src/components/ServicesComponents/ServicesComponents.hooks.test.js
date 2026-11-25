import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useEditAgreementMock = vi.fn();
const useEditAgreementDispatchMock = vi.fn();

vi.mock("../Agreements/AgreementEditor/AgreementEditorContext.hooks", () => ({
    useEditAgreement: () => useEditAgreementMock(),
    useEditAgreementDispatch: () => useEditAgreementDispatchMock()
}));

const setAlertMock = vi.fn();
vi.mock("../../hooks/use-alert.hooks", () => ({
    default: () => ({ setAlert: setAlertMock })
}));

import useServicesComponents from "./ServicesComponents.hooks";

const AGREEMENT_ID = 42;
const SERVICE_REQ_TYPE = "SEVERABLE";
const CONTINUE_BTN_TEXT = "Continue";

const POP_CONFIRMATION_MESSAGE =
    "Changing the Period of Performance dates will alter the agreement’s Period of Performance. Some budget lines will need an updated Obligate By Date to fit within the new timeframe. Do you want to continue updating this services component?";

const POP_DELETE_CONFIRMATION_MESSAGE =
    "Deleting this Services Component will alter the agreement’s overall Period of Performance. Some budget lines will need an updated Obligate By Date to fit within the new timeframe. Do you want to continue deleting this services component?";

const bli = (date_needed) => ({ date_needed });

const renderUseServicesComponents = (
    setHasUnsavedChanges = vi.fn(),
    scFormSuite = undefined,
    nonDraftBudgetLines = [],
    allBudgetLines = [],
    isSuperUser = false,
    tracksContractModifications = false
) =>
    renderHook(() =>
        useServicesComponents(
            AGREEMENT_ID,
            SERVICE_REQ_TYPE,
            CONTINUE_BTN_TEXT,
            setHasUnsavedChanges,
            scFormSuite,
            nonDraftBudgetLines,
            allBudgetLines,
            isSuperUser,
            tracksContractModifications
        )
    );

describe("useServicesComponents", () => {
    let dispatchMock;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatchMock = vi.fn();
        useEditAgreementDispatchMock.mockReturnValue(dispatchMock);
        useEditAgreementMock.mockReturnValue({ services_components: [] });
    });

    describe("no PoP conflict", () => {
        it("saves immediately (add mode) when there is no non-draft BLI conflict", () => {
            const { result } = renderUseServicesComponents();

            act(() => {
                result.current.setFormData({
                    number: 1,
                    optional: false,
                    description: "New SC",
                    popStartDate: "01/01/2025",
                    popEndDate: "12/31/2025",
                    mode: "add"
                });
            });

            act(() => {
                result.current.handleSubmit({ preventDefault: vi.fn() });
            });

            expect(dispatchMock).toHaveBeenCalledWith({
                type: "ADD_SERVICES_COMPONENT",
                payload: expect.objectContaining({ agreement_id: AGREEMENT_ID, number: 1 })
            });
            expect(result.current.showModal).toBe(false);
        });

        it("saves immediately (edit mode) when the new PoP window still covers all non-draft BLIs", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [{ id: 1, number: 1, period_start: "2025-01-01", period_end: "2025-12-31" }]
            });
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-06-15")]);

            act(() => {
                result.current.setFormData({
                    id: 1,
                    number: 1,
                    optional: false,
                    description: "Existing SC",
                    popStartDate: "01/01/2025",
                    popEndDate: "12/31/2025",
                    mode: "edit"
                });
            });

            act(() => {
                result.current.handleSubmit({ preventDefault: vi.fn() });
            });

            expect(dispatchMock).toHaveBeenCalledWith({
                type: "UPDATE_SERVICES_COMPONENT",
                payload: expect.objectContaining({ number: 1, has_changed: true })
            });
            expect(result.current.showModal).toBe(false);
        });
    });

    describe("PoP conflict — confirmation modal", () => {
        it("shows the confirm modal instead of saving (add mode) when a non-draft BLI falls outside the existing SCs' window", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [{ id: 1, number: 1, period_start: "2025-01-01", period_end: "2025-06-30" }]
            });
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-11-01")]);

            act(() => {
                result.current.setFormData({
                    number: 2,
                    optional: false,
                    description: "New SC",
                    popStartDate: "07/01/2025",
                    popEndDate: "10/31/2025",
                    mode: "add"
                });
            });

            act(() => {
                result.current.handleSubmit({ preventDefault: vi.fn() });
            });

            expect(dispatchMock).not.toHaveBeenCalled();
            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.heading).toBe(POP_CONFIRMATION_MESSAGE);
            expect(result.current.modalProps.actionButtonText).toBe("Continue with Updates");
            expect(result.current.modalProps.secondaryButtonText).toBe("Cancel");
        });

        it("shows the confirm modal instead of saving (add mode) when it's the first SC on the agreement and its window excludes a non-draft BLI", () => {
            // Regression: with no existing SCs, the suite must still see the new SC being
            // added — otherwise allServicesComponents is empty and the check silently no-ops.
            useEditAgreementMock.mockReturnValue({ services_components: [] });
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-11-01")]);

            act(() => {
                result.current.setFormData({
                    number: 1,
                    optional: false,
                    description: "First SC",
                    popStartDate: "01/01/2025",
                    popEndDate: "06/30/2025",
                    mode: "add"
                });
            });

            act(() => {
                result.current.handleSubmit({ preventDefault: vi.fn() });
            });

            expect(dispatchMock).not.toHaveBeenCalled();
            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.heading).toBe(POP_CONFIRMATION_MESSAGE);
        });

        it("shows the confirm modal instead of saving (edit mode) when the new PoP window excludes a non-draft BLI", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [{ id: 1, number: 1, period_start: "2025-01-01", period_end: "2025-12-31" }]
            });
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-06-15")]);

            act(() => {
                result.current.setFormData({
                    id: 1,
                    number: 1,
                    optional: false,
                    description: "Existing SC",
                    popStartDate: "07/01/2025",
                    popEndDate: "12/31/2025",
                    mode: "edit"
                });
            });

            act(() => {
                result.current.handleSubmit({ preventDefault: vi.fn() });
            });

            expect(dispatchMock).not.toHaveBeenCalled();
            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.heading).toBe(POP_CONFIRMATION_MESSAGE);
            expect(result.current.modalProps.actionButtonText).toBe("Continue with Updates");
            expect(result.current.modalProps.secondaryButtonText).toBe("Cancel");
        });

        it("proceeds with the save when the user confirms the modal", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [{ id: 1, number: 1, period_start: "2025-01-01", period_end: "2025-12-31" }]
            });
            const setHasUnsavedChanges = vi.fn();
            const { result } = renderUseServicesComponents(setHasUnsavedChanges, undefined, [bli("2025-06-15")]);

            act(() => {
                result.current.setFormData({
                    id: 1,
                    number: 1,
                    optional: false,
                    description: "Existing SC",
                    popStartDate: "07/01/2025",
                    popEndDate: "12/31/2025",
                    mode: "edit"
                });
            });

            act(() => {
                result.current.handleSubmit({ preventDefault: vi.fn() });
            });

            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(dispatchMock).toHaveBeenCalledWith({
                type: "UPDATE_SERVICES_COMPONENT",
                payload: expect.objectContaining({ number: 1, has_changed: true })
            });
            expect(setHasUnsavedChanges).toHaveBeenCalledWith(true);
            expect(result.current.showModal).toBe(false);
        });

        it("does not save and just closes the modal when the user cancels", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [{ id: 1, number: 1, period_start: "2025-01-01", period_end: "2025-12-31" }]
            });
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-06-15")]);

            act(() => {
                result.current.setFormData({
                    id: 1,
                    number: 1,
                    optional: false,
                    description: "Existing SC",
                    popStartDate: "07/01/2025",
                    popEndDate: "12/31/2025",
                    mode: "edit"
                });
            });

            act(() => {
                result.current.handleSubmit({ preventDefault: vi.fn() });
            });

            act(() => {
                result.current.setShowModal(false);
            });

            expect(dispatchMock).not.toHaveBeenCalled();
            expect(result.current.showModal).toBe(false);
            // The in-progress edit is preserved (not reset) after cancel.
            expect(result.current.formData).toEqual(
                expect.objectContaining({ number: 1, popStartDate: "07/01/2025", popEndDate: "12/31/2025" })
            );
        });
    });

    describe("handleDelete — an SC with Executing or Obligated budget lines (OPS-3268)", () => {
        const servicesComponents = [
            { id: 1, number: 1, display_title: "SC1" },
            { id: 2, number: 2, display_title: "SC2" }
        ];

        it.each(["IN_EXECUTION", "OBLIGATED"])("blocks the delete with an error when a %s line is on it", (status) => {
            useEditAgreementMock.mockReturnValue({ services_components: servicesComponents });
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [
                { id: 900, status, services_component_id: 2 }
            ]);

            act(() => {
                result.current.handleDelete(2);
            });

            expect(result.current.showModal).toBe(false);
            expect(dispatchMock).not.toHaveBeenCalled();
            expect(setAlertMock).toHaveBeenCalledWith(
                // Not closeable: the shared Alert's close icon can't be reached by keyboard.
                expect.objectContaining({
                    type: "error",
                    heading: "This services component can't be deleted",
                    isCloseable: false
                })
            );
        });

        it("goes by a line's current SC number, not its saved services_component_id (moved line)", () => {
            useEditAgreementMock.mockReturnValue({ services_components: servicesComponents });
            const movedLine = { id: 900, status: "OBLIGATED", services_component_id: 2, services_component_number: 1 };
            // An unrelated OBE line actually on SC2, so SC2 isn't "empty" (AC1) for this test's purposes.
            const unrelatedObeLine = { id: 901, status: "PLANNED", is_obe: true, services_component_id: 2 };
            const { result } = renderUseServicesComponents(
                vi.fn(),
                undefined,
                [movedLine],
                [movedLine, unrelatedObeLine]
            );

            act(() => {
                result.current.handleDelete(2);
            });

            expect(result.current.showModal).toBe(true);
            expect(setAlertMock).not.toHaveBeenCalled();
        });

        it("still allows the delete when its only non-Draft lines are Planned", () => {
            useEditAgreementMock.mockReturnValue({ services_components: servicesComponents });
            const budgetLines = [
                { id: 900, status: "PLANNED", services_component_id: 2 },
                { id: 901, status: "OBLIGATED", services_component_id: 1 }
            ];
            const { result } = renderUseServicesComponents(vi.fn(), undefined, budgetLines, budgetLines);

            act(() => {
                result.current.handleDelete(2);
            });

            expect(result.current.showModal).toBe(true);
            expect(setAlertMock).not.toHaveBeenCalled();
        });
    });

    describe("handleDelete — PoP impact of removing an SC", () => {
        it("shows the generic delete confirmation (not the PoP modal) when no non-draft BLI is affected", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [
                    { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" },
                    { id: 2, number: 2, display_title: "SC2", period_start: "2025-07-01", period_end: "2025-12-31" }
                ]
            });
            // An OBE line on SC1 so it isn't "empty" (AC1): OBE lines ride the generic confirm
            // modal, not the new Draft/Planned choice modal (AC2/AC3).
            const { result } = renderUseServicesComponents(
                vi.fn(),
                undefined,
                [bli("2025-08-15")],
                [{ id: 50, status: "PLANNED", is_obe: true, services_component_id: 1 }]
            );

            act(() => {
                result.current.handleDelete(1);
            });

            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.heading).toBe("Are you sure you want to delete SC1?");
            expect(result.current.modalProps.actionButtonText).toBe("Delete");
            expect(dispatchMock).not.toHaveBeenCalled();
        });

        it("shows the PoP-impact modal instead of the generic delete confirmation when deleting the only SC covering a non-draft BLI", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [
                    { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" },
                    { id: 2, number: 2, display_title: "SC2", period_start: "2025-07-01", period_end: "2025-12-31" }
                ]
            });
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-03-15")]);

            act(() => {
                result.current.handleDelete(1);
            });

            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.heading).toBe(POP_DELETE_CONFIRMATION_MESSAGE);
            expect(result.current.modalProps.actionButtonText).toBe("Continue with Deletion");
            expect(result.current.modalProps.secondaryButtonText).toBe("Cancel");
            expect(dispatchMock).not.toHaveBeenCalled();
        });

        it("dispatches the deletion when the user confirms the PoP-impact modal", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [
                    { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" },
                    { id: 2, number: 2, display_title: "SC2", period_start: "2025-07-01", period_end: "2025-12-31" }
                ]
            });
            const setHasUnsavedChanges = vi.fn();
            const { result } = renderUseServicesComponents(setHasUnsavedChanges, undefined, [bli("2025-03-15")]);

            act(() => {
                result.current.handleDelete(1);
            });

            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(dispatchMock).toHaveBeenCalledWith({
                type: "DELETE_SERVICE_COMPONENT",
                payload: expect.objectContaining({ number: 1, display_title: "SC1" })
            });
            expect(setHasUnsavedChanges).toHaveBeenCalledWith(true);
            expect(result.current.showModal).toBe(false);
        });

        it("dispatches the deletion when the user confirms the generic delete confirmation", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [
                    { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" }
                ]
            });
            // An OBE line so SC1 isn't "empty" (AC1) and the generic confirm modal still appears.
            const { result } = renderUseServicesComponents(
                vi.fn(),
                undefined,
                [],
                [{ id: 50, status: "PLANNED", is_obe: true, services_component_id: 1 }]
            );

            act(() => {
                result.current.handleDelete(1);
            });

            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.actionButtonText).toBe("Delete");

            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(dispatchMock).toHaveBeenCalledWith({
                type: "DELETE_SERVICE_COMPONENT",
                payload: expect.objectContaining({ number: 1 })
            });
            expect(result.current.showModal).toBe(false);
        });
    });

    describe("handleDelete — an empty SC (OPS-3268 AC1: no additional prompt)", () => {
        it("deletes immediately with no modal when the SC has no budget lines at all", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [
                    { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" }
                ]
            });
            const setHasUnsavedChanges = vi.fn();
            const { result } = renderUseServicesComponents(setHasUnsavedChanges, undefined, [], []);

            act(() => {
                result.current.handleDelete(1);
            });

            expect(result.current.showModal).toBe(false);
            expect(dispatchMock).toHaveBeenCalledWith({
                type: "DELETE_SERVICE_COMPONENT",
                payload: expect.objectContaining({ number: 1 })
            });
            expect(setHasUnsavedChanges).toHaveBeenCalledWith(true);
        });

        it("still shows the PoP-impact modal for an empty SC when deleting it affects another SC's budget line", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [
                    { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" },
                    { id: 2, number: 2, display_title: "SC2", period_start: "2025-07-01", period_end: "2025-12-31" }
                ]
            });
            // SC1 has no budget lines of its own, but deleting it narrows the agreement's PoP
            // window such that SC2's own non-draft line falls outside it.
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-03-15")], []);

            act(() => {
                result.current.handleDelete(1);
            });

            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.actionButtonText).toBe("Continue with Deletion");
            expect(dispatchMock).not.toHaveBeenCalled();
        });

        it("doesn't mistake an unrelated unassigned Draft line for belonging to a brand-new, not-yet-saved empty SC (OPS-3268)", () => {
            // A new SC (added via "Add Services Component" but not yet saved) has no id yet. An
            // unassigned budget line also has no services_component_id. Without a guard, undefined
            // === undefined would make them look linked.
            const newUnsavedSc = {
                number: 2,
                display_title: "SC2",
                period_start: "2025-01-01",
                period_end: "2025-06-30"
            };
            useEditAgreementMock.mockReturnValue({ services_components: [newUnsavedSc] });
            const unrelatedUnassignedDraftLine = { id: 900, status: "DRAFT" };
            const setHasUnsavedChanges = vi.fn();
            const { result } = renderUseServicesComponents(
                setHasUnsavedChanges,
                undefined,
                [],
                [unrelatedUnassignedDraftLine]
            );

            act(() => {
                result.current.handleDelete(2);
            });

            // AC1 (empty SC, no prompt) still applies -- the unrelated Draft line must not count.
            expect(result.current.showModal).toBe(false);
            expect(dispatchMock).not.toHaveBeenCalledWith({
                type: "DELETE_BUDGET_LINE_ITEM",
                payload: unrelatedUnassignedDraftLine
            });
            expect(dispatchMock).toHaveBeenCalledWith({
                type: "DELETE_SERVICE_COMPONENT",
                payload: expect.objectContaining({ number: 2 })
            });
            expect(setHasUnsavedChanges).toHaveBeenCalledWith(true);
        });
    });

    describe("handleDelete — a PoP conflict combined with Draft/Planned budget lines (OPS-3268)", () => {
        it("still offers the delete-or-keep choice, not just Continue with Deletion, when both apply", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [
                    { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" },
                    { id: 2, number: 2, display_title: "SC2", period_start: "2025-07-01", period_end: "2025-12-31" }
                ]
            });
            const plannedLine = { id: 900, status: "PLANNED", services_component_id: 1 };
            // Dated so that removing SC1 strands this non-draft line outside the remaining window.
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-03-15")], [plannedLine]);

            act(() => {
                result.current.handleDelete(1);
            });

            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.actionButtonText).toBe("Delete");
            expect(result.current.modalProps.tertiaryButtonText).toBe("Keep");
            expect(result.current.modalProps.secondaryButtonText).toBe("Cancel");
            expect(dispatchMock).not.toHaveBeenCalled();
        });

        it("still dispatches deleting the chosen lines and the SC when the user picks Delete despite the PoP conflict", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [
                    { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" },
                    { id: 2, number: 2, display_title: "SC2", period_start: "2025-07-01", period_end: "2025-12-31" }
                ]
            });
            const plannedLine = { id: 900, status: "PLANNED", services_component_id: 1 };
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-03-15")], [plannedLine]);

            act(() => {
                result.current.handleDelete(1);
            });
            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(dispatchMock).toHaveBeenCalledWith({ type: "DELETE_BUDGET_LINE_ITEM", payload: plannedLine });
            expect(dispatchMock).toHaveBeenCalledWith({
                type: "DELETE_SERVICE_COMPONENT",
                payload: expect.objectContaining({ number: 1 })
            });
        });
    });

    describe("handleDelete — an SC with Draft/Planned budget lines (OPS-3268 AC2/AC3)", () => {
        const servicesComponents = [
            { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" }
        ];

        it.each(["DRAFT", "PLANNED"])("shows the delete-or-keep modal when the SC has a %s line", (status) => {
            useEditAgreementMock.mockReturnValue({ services_components: servicesComponents });
            const draftOrPlannedLine = { id: 900, status, services_component_id: 1 };
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [], [draftOrPlannedLine]);

            act(() => {
                result.current.handleDelete(1);
            });

            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.heading).toBe("Delete SC1's Draft and Planned budget lines too?");
            expect(result.current.modalProps.description).toBe(
                "This Services Component has Draft and/or Planned budget lines. Choose whether to delete them along with it, or keep them unassigned."
            );
            expect(result.current.modalProps.actionButtonText).toBe("Delete");
            expect(result.current.modalProps.tertiaryButtonText).toBe("Keep");
            expect(result.current.modalProps.secondaryButtonText).toBe("Cancel");
        });

        it("dispatches deleting the Draft/Planned lines and the SC, in that order, when the user picks Delete", () => {
            useEditAgreementMock.mockReturnValue({ services_components: servicesComponents });
            const draftLine = { id: 900, status: "DRAFT", services_component_id: 1 };
            const plannedLine = { id: 901, status: "PLANNED", services_component_id: 1 };
            // An OBE line, also matched to the SC, that must never be included in the delete set.
            const obeLine = { id: 902, status: "PLANNED", is_obe: true, services_component_id: 1 };
            const setHasUnsavedChanges = vi.fn();
            const { result } = renderUseServicesComponents(
                setHasUnsavedChanges,
                undefined,
                [],
                [draftLine, plannedLine, obeLine]
            );

            act(() => {
                result.current.handleDelete(1);
            });
            act(() => {
                result.current.modalProps.handleConfirm();
            });

            const calledTypesInOrder = dispatchMock.mock.calls.map((call) => call[0].type);
            expect(calledTypesInOrder).toEqual([
                "DELETE_BUDGET_LINE_ITEM",
                "DELETE_BUDGET_LINE_ITEM",
                "DELETE_SERVICE_COMPONENT"
            ]);
            expect(dispatchMock).toHaveBeenCalledWith({ type: "DELETE_BUDGET_LINE_ITEM", payload: draftLine });
            expect(dispatchMock).toHaveBeenCalledWith({ type: "DELETE_BUDGET_LINE_ITEM", payload: plannedLine });
            expect(dispatchMock).not.toHaveBeenCalledWith({ type: "DELETE_BUDGET_LINE_ITEM", payload: obeLine });
            expect(setHasUnsavedChanges).toHaveBeenCalledWith(true);
            expect(result.current.showModal).toBe(false);
        });

        it("dispatches only the SC delete, keeping the budget lines unassigned, when the user picks Keep", () => {
            useEditAgreementMock.mockReturnValue({ services_components: servicesComponents });
            const plannedLine = { id: 900, status: "PLANNED", services_component_id: 1 };
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [], [plannedLine]);

            act(() => {
                result.current.handleDelete(1);
            });
            act(() => {
                result.current.modalProps.handleTertiary();
            });

            expect(dispatchMock).not.toHaveBeenCalledWith({ type: "DELETE_BUDGET_LINE_ITEM", payload: plannedLine });
            expect(dispatchMock).toHaveBeenCalledWith({
                type: "DELETE_SERVICE_COMPONENT",
                payload: expect.objectContaining({ number: 1 })
            });
            expect(result.current.showModal).toBe(false);
        });

        it("says a Planned line's deletion was sent for approval, not that it was deleted, when it would be approval-routed (OPS-3268)", () => {
            useEditAgreementMock.mockReturnValue({ services_components: servicesComponents });
            const plannedLine = { id: 900, status: "PLANNED", services_component_id: 1 };
            // Default isSuperUser/tracksContractModifications (both false) route a Planned line's
            // deletion through DD approval instead of hard-deleting it (OPS-3072/OPS-3268).
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [], [plannedLine]);

            act(() => {
                result.current.handleDelete(1);
            });
            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(setAlertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining(
                        "The deletion of 1 budget line has been sent to your Division Director for approval"
                    )
                })
            );
            expect(setAlertMock).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.not.stringContaining("and its budget lines have") })
            );
        });

        it("says the budget lines were deleted when the acting user is a superuser (OPS-3268)", () => {
            useEditAgreementMock.mockReturnValue({ services_components: servicesComponents });
            const plannedLine = { id: 900, status: "PLANNED", services_component_id: 1 };
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [], [plannedLine], true, false);

            act(() => {
                result.current.handleDelete(1);
            });
            act(() => {
                result.current.modalProps.handleConfirm();
            });

            expect(setAlertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("and its budget lines have been successfully deleted")
                })
            );
            expect(setAlertMock).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.not.stringContaining("Division Director") })
            );
        });

        it("falls through to the generic delete confirmation when the SC's only lines are OBE", () => {
            useEditAgreementMock.mockReturnValue({ services_components: servicesComponents });
            const obeLine = { id: 900, status: "PLANNED", is_obe: true, services_component_id: 1 };
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [], [obeLine]);

            act(() => {
                result.current.handleDelete(1);
            });

            expect(result.current.showModal).toBe(true);
            expect(result.current.modalProps.actionButtonText).toBe("Delete");
            expect(result.current.modalProps.tertiaryButtonText).toBeUndefined();
        });
    });

    describe("required-field validation stays a hard block", () => {
        it("does not save and does not show the confirm modal when the SC suite reports errors", () => {
            const scFormSuite = {
                get: () => ({ hasErrors: () => true }),
                reset: vi.fn()
            };
            const { result } = renderUseServicesComponents(vi.fn(), scFormSuite, [bli("2025-11-01")]);

            act(() => {
                result.current.setFormData({
                    number: 0,
                    optional: false,
                    description: "",
                    popStartDate: "01/01/2025",
                    popEndDate: "06/30/2025",
                    mode: "add"
                });
            });

            act(() => {
                result.current.handleSubmit({ preventDefault: vi.fn() });
            });

            expect(dispatchMock).not.toHaveBeenCalled();
            expect(result.current.showModal).toBe(false);
        });
    });
});
