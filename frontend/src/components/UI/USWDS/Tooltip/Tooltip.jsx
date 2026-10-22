import React from "react";
import tooltip from "@uswds/uswds/js/usa-tooltip";

/**
 * A tooltip is a short descriptive message that appears when a user hovers or focuses on an element.
 * @component
 * @param {object} props - the component props
 * @param {string} props.label - the content of the tooltip
 * @param {("top" | "right" | "bottom" | "left")} [props.position] - where the tooltip should be placed (if possible), default is "top"
 * @param {string} [props.className] - the className for the span container, optional
 * @param {("card" | "card-lg" | "mobile" | "mobile-lg" | "tablet" | "tablet-lg" | "desktop" | "desktop-lg" | "widescreen")} [props.maxWidth] - sizes the tooltip bubble to a USWDS `width-*` utility width and enables text wrapping, optional
 * @param {React.ReactNode} props.children
 * @returns {React.ReactElement}
 * @note
 * The child element should be a valid HTML element that can have a tooltip applied to it.
 * The tooltip will be applied to the first child of the span container.
 */

const Tooltip = ({ label, position = "top", children, className, maxWidth }) => {
    const wrapperRef = React.useRef(null);
    // USWDS's tooltip.on() wraps the trigger in a new `.usa-tooltip` span and appends a
    // sibling `.usa-tooltip__body` span, so `wrapperRef.current.firstChild` stops being the
    // trigger after the first run. Cache the real trigger once so later effect runs (e.g. a
    // label/position change) update it in place instead of re-wrapping it.
    const triggerRef = React.useRef(/** @type {HTMLElement | null} */ (null));
    const isInitializedRef = React.useRef(false);

    // Shared by the "label became falsy" path and the unmount cleanup below so both fully
    // undo USWDS's wrapping and reset isInitializedRef in lockstep with tooltip.off(). Without
    // this, React StrictMode's dev-only mount->cleanup->remount replay strips the USWDS event
    // listeners (via the unmount effect's cleanup) while isInitializedRef stays true, so the
    // remount pass takes the "already initialized" branch and never re-attaches them.
    const teardown = React.useCallback(() => {
        const triggerElement = triggerRef.current;
        if (!tooltip || !triggerElement || !isInitializedRef.current) {
            return;
        }
        tooltip.off(triggerElement);
        const tooltipWrapper = triggerElement.parentElement;
        if (tooltipWrapper?.classList.contains("usa-tooltip")) {
            tooltipWrapper.replaceWith(triggerElement);
        }
        triggerElement.classList.remove("usa-tooltip__trigger");
        triggerElement.removeAttribute("title");
        triggerElement.removeAttribute("data-position");
        triggerElement.removeAttribute("aria-describedby");
        triggerElement.removeAttribute("tabindex");
        isInitializedRef.current = false;
    }, []);

    React.useLayoutEffect(() => {
        if (!triggerRef.current) {
            triggerRef.current = wrapperRef.current?.firstChild ?? null;
        }
        const triggerElement = triggerRef.current;

        if (!triggerElement || !tooltip) {
            return;
        }

        if (!label) {
            teardown();
            return;
        }

        if (!isInitializedRef.current) {
            triggerElement.classList.add("usa-tooltip");
            triggerElement.title = label;
            triggerElement.setAttribute("data-position", position);
            tooltip.on(triggerElement);
            isInitializedRef.current = true;
        } else {
            // Already wrapped by USWDS — update the existing trigger/body in place.
            // Re-running tooltip.on() here would nest another `.usa-tooltip` wrapper and
            // `.usa-tooltip__body` instead of replacing the current one.
            const tooltipBody = triggerElement.parentElement?.querySelector(".usa-tooltip__body");
            if (tooltipBody) {
                tooltipBody.textContent = label;
            }
            triggerElement.setAttribute("data-position", position);
        }

        if (maxWidth) {
            // USWDS creates the tooltip body as a sibling of triggerElement during tooltip.on() above,
            // so it can only be targeted once it exists in the DOM, not via a prop on this component.
            const tooltipBody = triggerElement.parentElement?.querySelector(".usa-tooltip__body");
            // The tooltip body is absolutely positioned with an auto width, shrink-to-fit against a
            // containing block that's only as wide as the trigger itself — so a maxw-* utility alone
            // collapses the box down to its longest word instead of filling the available space.
            // width-* forces the intended size; USWDS's own wrap behavior does the same thing with
            // width: 100% + min-width: 50vw for the same reason.
            tooltipBody?.classList.add(`width-${maxWidth}`, "text-wrap");
        }
    }, [label, position, maxWidth, teardown]);

    // Only tear down the USWDS listeners on unmount — not on every label/position/maxWidth
    // change, since the main effect above now updates an initialized tooltip in place.
    React.useEffect(() => teardown, [teardown]);

    return (
        <span
            ref={wrapperRef}
            className={className}
        >
            {children}
        </span>
    );
};

export default Tooltip;
