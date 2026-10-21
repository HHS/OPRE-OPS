import USWDS from "@uswds/uswds/js";
import React from "react";
import styles from "./TextClip.module.scss";

const { tooltip } = USWDS;

/**
 * The TextClip component is a layout component to limit text to a number of lines and
 * provide the full value in a tooltip when the rendered text actually overflows.
 * @component
 * @param {object} props - The component props.
 * @param {string} [props.text] - The text
 * @param {string} [props.tooltipText] - optional, tooltip text to show on hover when it differs
 * from `text` (e.g. the full title behind a nickname) — shown even when `text` isn't clipped.
 * Defaults to `text`, which reproduces the original overflow-only tooltip behavior.
 * @param {number} [props.maxLines] - optional (default 2), the number of lines to display
 * @returns {React.ReactElement} - The rendered component.
 **/
const TextClip = ({ text, tooltipText = text, maxLines = 2 }) => {
    const spanRef = React.useRef(null);
    const [isOverflowing, setIsOverflowing] = React.useState(false);

    React.useEffect(() => {
        const el = spanRef.current;
        if (!el) return;

        const checkOverflow = () => {
            const overflowing = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
            setIsOverflowing((prev) => (prev === overflowing ? prev : overflowing));
        };

        checkOverflow();

        const resizeObserver = new ResizeObserver(checkOverflow);
        resizeObserver.observe(el);

        return () => resizeObserver.disconnect();
    }, [text, maxLines]);

    // Manage the USWDS tooltip imperatively. We deliberately do NOT put
    // `usa-tooltip` or `title` in JSX, because USWDS mutates both on init
    // (wraps the element, strips the title, swaps class to usa-tooltip__trigger).
    // If React kept re-asserting them on every render it would re-trigger
    // setUpAttributes on hover and stack duplicate wrappers / empty bodies.
    const hasDistinctTooltip = Boolean(tooltipText) && tooltipText !== text;

    React.useEffect(() => {
        const el = spanRef.current;
        if (!el || !text || !(isOverflowing || hasDistinctTooltip)) return;

        el.setAttribute("title", tooltipText ?? text);
        el.setAttribute("data-position", "right");
        el.classList.add("usa-tooltip");
        tooltip.on(el);

        return () => {
            tooltip.off(el);
            // After tooltip.off, USWDS leaves the trigger class behind; clean up.
            el.classList.remove("usa-tooltip", "usa-tooltip__trigger");
            el.removeAttribute("title");
            el.removeAttribute("data-position");
            el.removeAttribute("aria-describedby");
            el.removeAttribute("tabindex");
        };
    }, [isOverflowing, hasDistinctTooltip, text, tooltipText]);

    return (
        <span
            ref={spanRef}
            className={styles.limitedLinesWithEllipsis}
            style={{ WebkitLineClamp: maxLines }}
        >
            {text}
        </span>
    );
};

export default TextClip;
