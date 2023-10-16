export const removeBorderBottomIfExpanded = (isExpanded) => (isExpanded ? "border-bottom-none" : "");
export const changeBgColorIfExpanded = (isExpanded) => ({
    backgroundColor: isExpanded ? "var(--neutral-lightest)" : ""
});
