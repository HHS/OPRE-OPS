import { useContext, useEffect, useRef, useMemo } from "react";
import NavigationBlockerContext from "../contexts/NavigationBlockerContext";

/**
 * Custom hook to use the navigation blocker context
 * @returns {Object} The navigation blocker context
 */
export const useNavigationBlockerContext = () => {
    const context = useContext(NavigationBlockerContext);
    if (!context) {
        throw new Error("useNavigationBlockerContext must be used within a NavigationBlockerProvider");
    }
    return context;
};

/**
 * Custom hook for components to register navigation blocking behavior
 * @param {Object} config - The blocker configuration
 * @param {string} config.id - Unique identifier for this blocker
 * @param {boolean} config.shouldBlock - Whether navigation should be blocked
 * @param {Object} config.modalProps - Modal configuration for the blocking dialog
 * @param {string} config.modalProps.heading - Modal heading text
 * @param {string} [config.modalProps.description] - Modal description text
 * @param {string} config.modalProps.actionButtonText - Primary action button text
 * @param {string} [config.modalProps.secondaryButtonText] - Secondary action button text
 * @param {Function} config.modalProps.handleConfirm - Function to call when user confirms
 * @param {Function} [config.modalProps.handleSecondary] - Function to call when user cancels
 * @returns {Object} Blocker utilities
 */
export const useNavigationBlocker = (config) => {
    const { registerBlocker, updateBlocker, blockerState, isBlocked } = useNavigationBlockerContext();
    const unregisterRef = useRef(null);

    // Extract primitive values to avoid object reference changes
    const configId = config?.id;
    const shouldBlock = config?.shouldBlock;

    // Memoize modalProps to prevent unnecessary re-renders
    // We deliberately check individual properties instead of the whole object to prevent infinite loops
    const modalProps = useMemo(() => {
        return config?.modalProps;
    }, [
        config?.modalProps?.heading,
        config?.modalProps?.description,
        config?.modalProps?.actionButtonText,
        config?.modalProps?.secondaryButtonText,
        config?.modalProps?.handleConfirm,
        config?.modalProps?.handleSecondary
    ]);

    // Register the blocker on mount and when ID changes
    useEffect(() => {
        if (configId) {
            // Unregister previous if exists
            if (unregisterRef.current) {
                unregisterRef.current();
            }

            // Register new blocker
            unregisterRef.current = registerBlocker({
                id: configId,
                shouldBlock,
                modalProps
            });
        }

        // Cleanup on unmount
        return () => {
            if (unregisterRef.current) {
                unregisterRef.current();
                unregisterRef.current = null;
            }
        };
    }, [configId, registerBlocker, shouldBlock, modalProps]);

    // Update blocker when shouldBlock or modalProps changes (for performance)
    useEffect(() => {
        if (configId && unregisterRef.current) {
            updateBlocker(configId, {
                shouldBlock,
                modalProps
            });
        }
    }, [shouldBlock, modalProps, configId, updateBlocker]);

    // Memoize the return object to prevent unnecessary re-renders of consuming components
    return useMemo(() => ({
        blockerState,
        isBlocked,
        // Utility function to manually unregister (though automatic cleanup happens on unmount)
        unregister: () => {
            if (unregisterRef.current) {
                unregisterRef.current();
                unregisterRef.current = null;
            }
        }
    }), [blockerState, isBlocked]);
};

export default useNavigationBlocker;
