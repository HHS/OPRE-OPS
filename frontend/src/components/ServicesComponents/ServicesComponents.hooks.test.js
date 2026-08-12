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
    "Changing the Period of Performance dates will alter the agreement’s start and end. Some budget lines will need an updated Obligate By Date to fit within the new timeframe. Do you want to continue updating this services component?";

const POP_DELETE_CONFIRMATION_MESSAGE =
    "Deleting this Services Component will alter the agreement’s overall Period of Performance. Some budget lines will need an updated Obligate By Date to fit within the new timeframe. Do you want to continue deleting this services component?";

const bli = (date_needed) => ({ date_needed });

const renderUseServicesComponents = (
    setHasUnsavedChanges = vi.fn(),
    scFormSuite = undefined,
    nonDraftBudgetLines = []
) =>
    renderHook(() =>
        useServicesComponents(
            AGREEMENT_ID,
            SERVICE_REQ_TYPE,
            CONTINUE_BTN_TEXT,
            setHasUnsavedChanges,
            scFormSuite,
            nonDraftBudgetLines
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

    describe("handleDelete — PoP impact of removing an SC", () => {
        it("shows the generic delete confirmation (not the PoP modal) when no non-draft BLI is affected", () => {
            useEditAgreementMock.mockReturnValue({
                services_components: [
                    { id: 1, number: 1, display_title: "SC1", period_start: "2025-01-01", period_end: "2025-06-30" },
                    { id: 2, number: 2, display_title: "SC2", period_start: "2025-07-01", period_end: "2025-12-31" }
                ]
            });
            const { result } = renderUseServicesComponents(vi.fn(), undefined, [bli("2025-08-15")]);

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
            const { result } = renderUseServicesComponents(vi.fn(), undefined, []);

            act(() => {
                result.current.handleDelete(1);
            });

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
