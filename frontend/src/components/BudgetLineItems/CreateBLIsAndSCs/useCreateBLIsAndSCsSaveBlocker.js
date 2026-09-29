import React from "react";
import { proceedIfBlocked } from "../../../hooks/proceedIfBlocked";

/**
 * Prompt to save (or discard) unsaved changes when the user navigates away mid-edit, via
 * react-router's useBlocker. Owns the handleSave/blocker refs needed to read their latest values
 * from the blocked-navigation effect without re-subscribing it on every render.
 * @param {Object} args
 * @param {import("react-router-dom").Blocker} args.blocker
 * @param {Function} args.handleSave
 * @param {boolean} args.requiresFinancialApproval - Whether unsaved changes require Division Director approval.
 * @param {Function} args.navigate
 * @param {Function} args.setIsEditMode
 * @param {Function} args.setHasUnsavedChanges
 * @param {Function} args.setShowSaveChangesModal
 * @param {Function} args.setModalProps
 */
const useCreateBLIsAndSCsSaveBlocker = ({
    blocker,
    handleSave,
    requiresFinancialApproval,
    navigate,
    setIsEditMode,
    setHasUnsavedChanges,
    setShowSaveChangesModal,
    setModalProps
}) => {
    const handleSaveRef = React.useRef(handleSave);

    React.useEffect(() => {
        handleSaveRef.current = handleSave;
    }, [handleSave]);

    const blockerRef = React.useRef(blocker);

    React.useEffect(() => {
        blockerRef.current = blocker;
    }, [blocker]);

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            const destination = blocker.location?.pathname;
            // Only surface the "require approval" wording when the changes actually route for
            // review. With the capability ON (and the edits in the flag's scope) they apply
            // immediately, so fall through to the neutral "Save Changes" copy.
            const modalContent = requiresFinancialApproval
                ? {
                      heading: "Save changes before leaving?",
                      description:
                          "You have unsaved changes and some will require approval from your Division Director if you save. If you leave without saving, these changes will be lost.",
                      actionButtonText: "Save & Send to Approval",
                      secondaryButtonText: "Leave without saving"
                  }
                : {
                      heading: "Save changes before leaving?",
                      description: "You have unsaved changes. If you leave without saving, these changes will be lost.",
                      actionButtonText: "Save Changes",
                      secondaryButtonText: "Leave without saving"
                  };
            setShowSaveChangesModal(true);
            setModalProps({
                ...modalContent,
                handleConfirm: async () => {
                    await handleSaveRef.current(true);
                    setShowSaveChangesModal(false);
                    blocker.reset();
                    if (destination) {
                        navigate(destination);
                    }
                },
                handleSecondary: async () => {
                    setHasUnsavedChanges(false);
                    setShowSaveChangesModal(false);
                    setIsEditMode(false);
                    await proceedIfBlocked(blockerRef.current);
                },
                closeModal: () => {
                    blocker.reset();
                }
            });
        }
    }, [
        blocker,
        requiresFinancialApproval,
        navigate,
        setIsEditMode,
        setHasUnsavedChanges,
        setShowSaveChangesModal,
        setModalProps
    ]);
};

export default useCreateBLIsAndSCsSaveBlocker;
