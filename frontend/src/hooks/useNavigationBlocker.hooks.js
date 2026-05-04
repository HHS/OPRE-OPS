import React from "react";
import { useBlocker } from "react-router-dom";

/**
 * @param {Object} options
 * @param {boolean} options.hasChanged - Whether the form has unsaved changes
 * @param {() => Promise<void>} options.saveChanges - Async function to save changes (should throw on failure)
 * @param {() => void} options.onExit - Function to call when exiting edit mode
 * @param {(error: unknown) => void} [options.onSaveError] - Optional error handler for save failures
 */
export default function useNavigationBlocker({ hasChanged, saveChanges, onExit, onSaveError }) {
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

    const proceedIfBlocked = async () => {
        const currentBlocker = blockerRef.current;
        if (!currentBlocker || currentBlocker.state !== "blocked") {
            return;
        }
        try {
            await currentBlocker.proceed();
        } catch (error) {
            const message = error && typeof error.message === "string" ? error.message.trim() : "";
            // Known React Router bug — proceed() throws when blocker has already transitioned.
            // String match is fragile; revisit if upgrading react-router.
            if (message.startsWith("Invalid blocker state transition")) {
                console.warn("Ignored known React Router blocker exception:", message);
                return;
            }
            throw error;
        }
    };

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            setShowBlockerModal(true);
            setBlockerModalProps({
                heading: "You have unsaved changes",
                description: "Do you want to save your changes before leaving this page?",
                actionButtonText: "Save Changes",
                secondaryButtonText: "Leave without saving",
                handleConfirm: async () => {
                    try {
                        await saveChangesRef.current();
                        setShowBlockerModal(false);
                        onExitRef.current();
                        await proceedIfBlocked();
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
                    await proceedIfBlocked();
                },
                closeModal: () => {
                    setShowBlockerModal(false);
                    blockerRef.current.reset();
                }
            });
        }
    }, [blocker.state]);

    return { showBlockerModal, setShowBlockerModal, blockerModalProps, setIsCancelling };
}
