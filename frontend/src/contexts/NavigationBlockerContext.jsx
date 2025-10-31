import React from "react";
import { useBlocker } from "react-router-dom";
import SaveChangesAndExitModal from "../components/UI/Modals/SaveChangesAndExitModal";

const NavigationBlockerContext = React.createContext();
/**
 * NavigationBlockerProvider - manages a single navigation blocker instance
 * that can be shared across different components.
 */
export const NavigationBlockerProvider = ({ children }) => {
    // registtry of blocking conditions from different components
    const [blockerRegistry, setBlockerRegistry] = React.useState(new Map());
    // modal state
    const [showModal, setShowModal] = React.useState(false);
    const [currentModalProps, setCurrentModalProps] = React.useState(null);

    // determine if any component wants to block navigation
    const shouldBlock = React.useCallback(
        ({ currentLocation, nextLocation }) => {
            if (currentLocation.pathname === nextLocation.pathname) {
                return false;
            }

            // Check if any registered component wants to block
            for (const [, blocker] of blockerRegistry) {
                if (blocker.shouldBlock) {
                    return true;
                }
            }
            return false;
        },
        [blockerRegistry]
    );

    // Single blocker instance managed by the provider
    const blocker = useBlocker(shouldBlock);

    // Handle when navigation is blocked
    React.useEffect(() => {
        if (blocker.state === "blocked") {
            // Find the first blocking component and use its modal props
            const blockingComponent = Array.from(blockerRegistry.values()).find((item) => item.shouldBlock);

            if (blockingComponent) {
                setCurrentModalProps({
                    ...blockingComponent.modalProps,
                    // Enhance the modal props with blocker control
                    handleConfirm: async () => {
                        if (blockingComponent.modalProps.handleConfirm) {
                            await blockingComponent.modalProps.handleConfirm();
                        }
                        setShowModal(false);
                        blocker.proceed();
                    },
                    handleSecondary: () => {
                        if (blockingComponent.modalProps.handleSecondary) {
                            blockingComponent.modalProps.handleSecondary();
                        }
                        setShowModal(false);
                        blocker.proceed();
                    },
                    resetBlocker: () => {
                        setShowModal(false);
                        blocker.reset();
                    }
                });
                setShowModal(true);
            }
        }
    }, [blocker.state, blocker, blockerRegistry]);

    // Register a component's blocking condition
    const registerBlocker = React.useCallback((blockerConfig) => {
        const { id, shouldBlock, modalProps } = blockerConfig;

        setBlockerRegistry((prev) => {
            const newRegistry = new Map(prev);
            newRegistry.set(id, { shouldBlock, modalProps });
            return newRegistry;
        });

        // Return unregister function
        return () => {
            setBlockerRegistry((prev) => {
                const newRegistry = new Map(prev);
                newRegistry.delete(id);
                return newRegistry;
            });
        };
    }, []);

    // Update an existing blocker's condition
    const updateBlocker = React.useCallback((id, updates) => {
        setBlockerRegistry((prev) => {
            const newRegistry = new Map(prev);
            const existing = newRegistry.get(id);
            if (existing) {
                newRegistry.set(id, { ...existing, ...updates });
            }
            return newRegistry;
        });
    }, []);

    const contextValue = React.useMemo(() => ({
        registerBlocker,
        updateBlocker,
        blockerState: blocker.state,
        isBlocked: blocker.state === "blocked"
    }), [registerBlocker, updateBlocker, blocker.state]);

    return (
        <NavigationBlockerContext.Provider value={contextValue}>
            {children}
            {showModal && currentModalProps && (
                <SaveChangesAndExitModal
                    heading={currentModalProps.heading}
                    description={currentModalProps.description}
                    actionButtonText={currentModalProps.actionButtonText}
                    secondaryButtonText={currentModalProps.secondaryButtonText}
                    handleConfirm={currentModalProps.handleConfirm}
                    handleSecondary={currentModalProps.handleSecondary}
                    resetBlocker={currentModalProps.resetBlocker}
                    setShowModal={setShowModal}
                />
            )}
        </NavigationBlockerContext.Provider>
    );
};

export default NavigationBlockerContext;
