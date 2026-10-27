import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useCreateBLIsAndSCsSaveBlocker from "./useCreateBLIsAndSCsSaveBlocker";

const getBlockerModalProps = ({ requiresFinancialApproval = false, requiresContractModification = false } = {}) => {
    const setModalProps = vi.fn();
    const setShowSaveChangesModal = vi.fn();
    renderHook(() =>
        useCreateBLIsAndSCsSaveBlocker({
            blocker: { state: "blocked", location: { pathname: "/agreements/1" }, reset: vi.fn() },
            handleSave: vi.fn(),
            requiresFinancialApproval,
            requiresContractModification,
            navigate: vi.fn(),
            setIsEditMode: vi.fn(),
            setHasUnsavedChanges: vi.fn(),
            setShowSaveChangesModal,
            setModalProps
        })
    );
    expect(setShowSaveChangesModal).toHaveBeenCalledWith(true);
    return setModalProps.mock.calls.at(-1)[0];
};

describe("useCreateBLIsAndSCsSaveBlocker", () => {
    it("uses the neutral copy when nothing requires approval", () => {
        const modalProps = getBlockerModalProps();
        expect(modalProps.description).toBe(
            "You have unsaved changes. If you leave without saving, these changes will be lost."
        );
        expect(modalProps.actionButtonText).toBe("Save Changes");
    });

    it("uses the Division Director approval copy for financial changes", () => {
        const modalProps = getBlockerModalProps({ requiresFinancialApproval: true });
        expect(modalProps.description).toMatch(/require approval from your Division Director/);
        expect(modalProps.description).not.toMatch(/contract modification/);
        expect(modalProps.actionButtonText).toBe("Save & Send to Approval");
    });

    // OPS-3072: e.g. deleting a Planned BL on an Awarded agreement has no financial snapshot
    // change, but still routes to approval and requires a contract modification.
    it("uses the contract-modification copy when the changes require one, even without financial changes", () => {
        const modalProps = getBlockerModalProps({ requiresContractModification: true });
        expect(modalProps.description).toMatch(/require a contract modification/);
        expect(modalProps.actionButtonText).toBe("Save & Send to Approval");
    });
});
