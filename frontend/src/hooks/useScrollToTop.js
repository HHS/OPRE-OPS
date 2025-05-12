import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scroll to the top of the page when the route changes
 * @param {Object} [options] - Options for the scroll
 * @param {ScrollBehavior} [options.behavior] - The behavior of the scroll
 * @param {ScrollLogicalPosition} [options.block] - The block of the scroll
 * @param {boolean} [options.enabled] - Whether the scroll is enabled
 */
export const useScrollToTop = (options = {}) => {
    const { pathname } = useLocation();
    const { behavior = "smooth", block = "start", enabled = true } = options;

    useEffect(() => {
        if (enabled) {
            window.scrollTo({
                top: 0,
                behavior,
                block
            });
        }
    }, [pathname, behavior, block, enabled]);
};
