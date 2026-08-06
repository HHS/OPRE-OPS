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

import useGrantNumbers from "./GrantNumbers.hooks";

const AGREEMENT_ID = 42;
const CONTINUE_BTN_TEXT = "Continue";

const renderUseGrantNumbers = (setHasUnsavedChanges = vi.fn()) =>
    renderHook(() => useGrantNumbers(AGREEMENT_ID, CONTINUE_BTN_TEXT, setHasUnsavedChanges));

describe("useGrantNumbers", () => {
    let dispatchMock;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatchMock = vi.fn();
        useEditAgreementDispatchMock.mockReturnValue(dispatchMock);
        useEditAgreementMock.mockReturnValue({ grant_numbers: [] });
    });

    it("dispatches ADD_GRANT_NUMBER with display_title 'Grant N' on submit in add mode", () => {
        const setHasUnsavedChanges = vi.fn();
        const { result } = renderUseGrantNumbers(setHasUnsavedChanges);

        act(() => {
            result.current.setFormData({
                number: 3,
                description: "First grant number",
                popStartDate: "",
                popEndDate: "",
                mode: "add"
            });
        });

        act(() => {
            result.current.handleSubmit({ preventDefault: vi.fn() });
        });

        expect(dispatchMock).toHaveBeenCalledWith({
            type: "ADD_GRANT_NUMBER",
            payload: expect.objectContaining({
                agreement_id: AGREEMENT_ID,
                number: 3,
                description: "First grant number",
                display_title: "Grant 3"
            })
        });
        expect(setHasUnsavedChanges).toHaveBeenCalledWith(true);
    });

    it("dispatches UPDATE_GRANT_NUMBER with has_changed on submit in edit mode", () => {
        useEditAgreementMock.mockReturnValue({
            grant_numbers: [{ id: 1, number: 1, description: "Existing", created_on: "2025-01-01" }]
        });
        const { result } = renderUseGrantNumbers();

        act(() => {
            result.current.setFormData({
                id: 1,
                number: 1,
                description: "Updated description",
                popStartDate: "",
                popEndDate: "",
                mode: "edit"
            });
        });

        act(() => {
            result.current.handleSubmit({ preventDefault: vi.fn() });
        });

        expect(dispatchMock).toHaveBeenCalledWith({
            type: "UPDATE_GRANT_NUMBER",
            payload: expect.objectContaining({
                number: 1,
                description: "Updated description",
                has_changed: true,
                display_title: "Grant 1"
            })
        });
    });

    it("delete with an id pushes the id onto deleted_grant_numbers_ids via DELETE_GRANT_NUMBER", () => {
        useEditAgreementMock.mockReturnValue({
            grant_numbers: [{ id: 7, number: 2, display_title: "Grant 2" }]
        });
        const { result } = renderUseGrantNumbers();

        act(() => {
            result.current.handleDelete(2);
        });
        act(() => {
            result.current.modalProps.handleConfirm();
        });

        expect(dispatchMock).toHaveBeenCalledWith({
            type: "DELETE_GRANT_NUMBER",
            payload: expect.objectContaining({ id: 7, number: 2 })
        });
    });

    it("delete without a persisted id dispatches DELETE_GRANT_NUMBER with no id field", () => {
        useEditAgreementMock.mockReturnValue({
            grant_numbers: [{ number: 5, display_title: "Grant 5" }]
        });
        const { result } = renderUseGrantNumbers();

        act(() => {
            result.current.handleDelete(5);
        });
        act(() => {
            result.current.modalProps.handleConfirm();
        });

        const dispatchedPayload = dispatchMock.mock.calls[0][0].payload;
        expect(dispatchMock).toHaveBeenCalledWith({
            type: "DELETE_GRANT_NUMBER",
            payload: expect.objectContaining({ number: 5 })
        });
        expect(dispatchedPayload.id).toBeUndefined();
    });
});
