import React from "react";
import { useBlocker } from "react-router-dom";
import { proceedIfBlocked } from "./proceedIfBlocked";

/**
 * @param {Object} options
 * @param {boolean} options.hasChanged - Whether the form has unsaved changes
 * @param {(destination: string | null) => Promise<void>} options.saveChanges - Async function to
 *   save changes (should throw on failure). Receives the destination pathname the user was
 *   navigating to, so the save can redirect there instead of a fixed returnTo URL.
 * @param {() => void} options.onExit - Function to call when exiting edit mode
 * @param {(error: unknown) => void} [options.onSaveError] - Optional error handler for save failures
 * @param {boolean} [options.requiresApproval=false] - When true, shows the approval-variant modal
 *   ("Save & send to approval") instead of the plain "Save Changes" variant.
 */
export default function useNavigationBlocker({
    hasChanged,
    saveChanges,
    onExit,
    onSaveError,
    requiresApproval = false
}) {
    const [showBlockerModal, setShowBlockerModal] = React.useState(false);
    const [blockerModalProps, setBlockerModalProps] = React.useState({});
    const [isCancelling, setIsCancelling] = React.useState(false);

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isCancelling && hasChanged && currentLocation.pathname !== nextLocation.pathname
    );

    const saveChangesRef = React.useRef(saveChanges);
    React.useEffect(() => {
        saveChangesRef.current = saveChanges;
    }, [saveChanges]);

    const onExitRef = React.useRef(onExit);
    React.useEffect(() => {
        onExitRef.current = onExit;
    }, [onExit]);

    const onSaveErrorRef = React.useRef(onSaveError);
    React.useEffect(() => {
        onSaveErrorRef.current = onSaveError;
    }, [onSaveError]);

    const blockerRef = React.useRef(blocker);
    React.useEffect(() => {
        blockerRef.current = blocker;
    }, [blocker]);

    // Capture the full destination (pathname + search + hash) when navigation is blocked so
    // saveChanges can redirect there instead of a fixed returnTo URL. Pathname-only would
    // drop query strings and hash fragments, sending users to a different route state than
    // the link they selected (e.g. losing filters or an anchor).
    const nextLocationRef = React.useRef(null);

    const proceedIfBlockedLocal = async () => {
        await proceedIfBlocked(blockerRef.current);
    };

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            const loc = blocker.location;
            nextLocationRef.current = loc ? `${loc.pathname}${loc.search ?? ""}${loc.hash ?? ""}` : null;

            const approvalVariant = requiresApproval;
            const heading = "Save changes before leaving?";
            const description = approvalVariant
                ? "You have unsaved changes and some will require approval from your Division Director if you save. If you leave without saving, these changes will be lost."
                : "You have unsaved changes. If you leave without saving, these changes will be lost.";
            const actionButtonText = approvalVariant ? "Save & send to approval" : "Save";

            setShowBlockerModal(true);
            setBlockerModalProps({
                heading,
                description,
                actionButtonText,
                secondaryButtonText: "Leave without saving",
                handleConfirm: async () => {
                    try {
                        await saveChangesRef.current(nextLocationRef.current);
                        setShowBlockerModal(false);
                        onExitRef.current();
                        await proceedIfBlockedLocal();
                    } catch (error) {
                        console.error(error);
                        if (onSaveErrorRef.current) {
                            onSaveErrorRef.current(error);
                        }
                        blockerRef.current.reset();
                    }
                },
                handleSecondary: async () => {
                    setShowBlockerModal(false);
                    onExitRef.current();
                    await proceedIfBlockedLocal();
                },
                closeModal: () => {
                    setShowBlockerModal(false);
                    blockerRef.current.reset();
                }
            });
        }
    }, [blocker.state, blocker.location, requiresApproval]);

    return { showBlockerModal, setShowBlockerModal, blockerModalProps, setIsCancelling };
}
