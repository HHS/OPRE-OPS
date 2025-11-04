import { useBlocker } from "react-router-dom";
import { useCallback, useEffect, useState, useRef } from "react";

/**
 * Simple navigation blocker hook that follows React Router best practices
 *
 * @param {Object} config - Configuration for the blocker
 * @param {boolean} config.shouldBlock - Whether navigation should be blocked
 * @param {Object} config.modalProps - Modal configuration
 * @param {string} config.modalProps.heading - Modal heading text
 * @param {string} [config.modalProps.description] - Modal description text
 * @param {string} config.modalProps.actionButtonText - Primary action button text
 * @param {string} [config.modalProps.secondaryButtonText] - Secondary action button text
 * @param {Function} config.modalProps.handleConfirm - Function to call when user confirms
 * @param {Function} [config.modalProps.handleSecondary] - Function to call when user cancels
 * @returns {Object} Blocker utilities
 */
export const useSimpleNavigationBlocker = ({ shouldBlock, modalProps }) => {
    const [showModal, setShowModal] = useState(false);
    const [currentModalProps, setCurrentModalProps] = useState(null);
    const modalPropsRef = useRef(modalProps);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // Update the ref whenever modalProps changes
    useEffect(() => {
        modalPropsRef.current = modalProps;
    }, [modalProps]);

    // Simple blocking function following React Router best practices
    const shouldBlockNavigation = useCallback(
        ({ currentLocation, nextLocation }) => {
            // Don't block if navigating to the same path
            if (currentLocation.pathname === nextLocation.pathname) {
                return false;
            }

            // Use the provided shouldBlock condition
            return shouldBlock;
        },
        [shouldBlock]
    );

    // Single blocker instance - this is key React Router best practice
    const blocker = useBlocker(shouldBlockNavigation);

    // Handle blocker state changes
    useEffect(() => {
        if (blocker.state === "blocked") {
            const currentProps = modalPropsRef.current;
            setCurrentModalProps({
                ...currentProps,
                // Enhanced with blocker control
                handleConfirm: async () => {
                    if (currentProps?.handleConfirm) {
                        await currentProps.handleConfirm();
                    }
                    setPendingNavigation('proceed');
                    setShowModal(false);
                },
                handleSecondary: () => {
                    if (currentProps?.handleSecondary) {
                        currentProps.handleSecondary();
                    }
                    setPendingNavigation('proceed');
                    setShowModal(false);
                },
                resetBlocker: () => {
                    setPendingNavigation('reset');
                    setShowModal(false);
                }
            });
            setShowModal(true);
        } else if (showModal) {
            setShowModal(false);
        }
    }, [blocker.state]);

    // Handle pending navigation after modal closes
    useEffect(() => {
        if (!showModal && pendingNavigation) {
            if (pendingNavigation === 'proceed') {
                blocker.proceed();
            } else if (pendingNavigation === 'reset') {
                blocker.reset();
            }
            setPendingNavigation(null);
        }
    }, [showModal, pendingNavigation, blocker]);

    return {
        blocker,
        showModal,
        modalProps: currentModalProps,
        setShowModal
    };
};

export default useSimpleNavigationBlocker;
