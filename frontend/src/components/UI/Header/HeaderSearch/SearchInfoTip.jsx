import { useEffect, useId, useState } from "react";
import icons from "../../../../uswds/img/sprite.svg";
import { SEARCH_INFO_ITEMS } from "./HeaderSearch.helpers";
import styles from "./HeaderSearch.module.scss";

/**
 * Info icon next to the header search that lists what the search matches on. Shows on hover and
 * keyboard focus, stays while either is active, and Esc dismisses it (from anywhere) without clearing the search box. The tip is
 * only in the DOM while shown, so its wording (e.g. "Contract #") never collides with page text.
 * @component
 * @returns {React.ReactElement} The rendered component.
 */
export const SearchInfoTip = () => {
    // Hover and focus are tracked separately: the tip stays up while either is active (WCAG 1.4.13
    // persistence) unless Esc dismissed it, which holds until both have ended or either starts again.
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const tipId = useId();
    const isVisible = (isHovered || isFocused) && !isDismissed;

    // Esc dismisses the tip wherever focus is (e.g. the pointer is on the icon while the search box has
    // focus). Capture phase + stopPropagation so the box's own Esc handler (clear the search) does not run.
    useEffect(() => {
        if (!isVisible) {
            return undefined;
        }
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                setIsDismissed(true);
            }
        };
        document.addEventListener("keydown", handleEscape, true);
        return () => document.removeEventListener("keydown", handleEscape, true);
    }, [isVisible]);

    const startHover = () => {
        setIsHovered(true);
        setIsDismissed(false);
    };
    const endHover = () => {
        setIsHovered(false);
        if (!isFocused) {
            setIsDismissed(false);
        }
    };
    const startFocus = () => {
        setIsFocused(true);
        setIsDismissed(false);
    };
    const endFocus = () => {
        setIsFocused(false);
        if (!isHovered) {
            setIsDismissed(false);
        }
    };

    return (
        <div
            className={styles.infoWrapper}
            onMouseEnter={startHover}
            onMouseLeave={endHover}
        >
            <button
                type="button"
                className={styles.infoButton}
                aria-label="What can I search for?"
                aria-describedby={isVisible ? tipId : undefined}
                onFocus={startFocus}
                onBlur={endFocus}
                data-cy="header-search-info"
            >
                <svg
                    className="usa-icon"
                    aria-hidden="true"
                    focusable="false"
                    role="img"
                >
                    <use href={`${icons}#info`}></use>
                </svg>
            </button>
            {isVisible && (
                <div
                    id={tipId}
                    role="tooltip"
                    className={styles.infoTip}
                    data-cy="header-search-info-tip"
                >
                    <div>You can search agreements by:</div>
                    <ul>
                        {SEARCH_INFO_ITEMS.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchInfoTip;
