import React from "react";
import { useBlocker } from "react-router-dom";
import { proceedIfBlocked } from "./proceedIfBlocked";

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

    const proceedIfBlockedLocal = async () => {
        await proceedIfBlocked(blockerRef.current);
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
    }, [blocker.state]);

    return { showBlockerModal, setShowBlockerModal, blockerModalProps, setIsCancelling };
}
