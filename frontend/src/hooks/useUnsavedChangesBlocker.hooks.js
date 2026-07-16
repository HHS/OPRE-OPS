import React from "react";
import { useBlocker } from "react-router-dom";
import { proceedIfBlocked } from "./proceedIfBlocked";

/**
 * Discard-only navigation blocker for forms that have no "save draft" option.
 *
 * When the user tries to navigate away with unsaved changes, a modal appears
 * offering two choices: go back (stay on the page) or leave without saving
 * (discard changes and proceed).
 *
 * Pairs with `SaveChangesAndExitModal` to render the confirmation UI.
 *
 * @param {Object} options
 * @param {boolean} options.hasChanged - Whether the form has unsaved changes.
 * @param {string} options.heading - Modal heading text.
 * @param {string} options.description - Modal body text.
 * @param {string} options.actionButtonText - Primary button label (stay / go back).
 * @param {string} options.secondaryButtonText - Secondary link label (leave / discard).
 * @returns {{ showBlockerModal: boolean, setShowBlockerModal: Function, blockerModalProps: Object }}
 */
export default function useUnsavedChangesBlocker({
    hasChanged,
    heading,
    description,
    actionButtonText,
    secondaryButtonText
}) {
    const [showBlockerModal, setShowBlockerModal] = React.useState(false);
    const [blockerModalProps, setBlockerModalProps] = React.useState({});

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => hasChanged && currentLocation.pathname !== nextLocation.pathname
    );

    const blockerRef = React.useRef(blocker);
    React.useEffect(() => {
        blockerRef.current = blocker;
    }, [blocker]);

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            setShowBlockerModal(true);
            setBlockerModalProps({
                heading,
                description,
                actionButtonText,
                secondaryButtonText,
                // Primary: go back — close the modal and reset the blocker (stay on page)
                handleConfirm: () => {
                    setShowBlockerModal(false);
                    blockerRef.current.reset();
                },
                // Secondary: leave without saving — close the modal and proceed with navigation.
                // The page unmount clears local form state; no explicit reset needed.
                handleSecondary: async () => {
                    setShowBlockerModal(false);
                    await proceedIfBlocked(blockerRef.current);
                },
                // Escape key: same as going back
                closeModal: () => {
                    setShowBlockerModal(false);
                    blockerRef.current.reset();
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocker.state]);

    return { showBlockerModal, setShowBlockerModal, blockerModalProps };
}
