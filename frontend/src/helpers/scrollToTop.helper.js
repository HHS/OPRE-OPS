/**
 * Scroll to the top of the page
 * @param {Object} [options] - Options for the scroll
 * @param {ScrollBehavior} [options.behavior] - The behavior of the scroll
 * @param {ScrollLogicalPosition} [options.block] - The block of the scroll
 * @param {boolean} [options.enabled] - Whether the scroll is enabled
 */
export const scrollToTop = (options = {}) => {
    const { behavior = "smooth", block = "start", enabled = true } = options;
    if (enabled) {
        window.scrollTo({
            top: 0,
            behavior,
            block
        });
    }
};
