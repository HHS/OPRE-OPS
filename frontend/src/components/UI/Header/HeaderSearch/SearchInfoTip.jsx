import { useId, useState } from "react";
import icons from "../../../../uswds/img/sprite.svg";
import { SEARCH_INFO_ITEMS } from "./HeaderSearch.helpers";
import styles from "./HeaderSearch.module.scss";

/**
 * Info icon next to the header search that lists what the search matches on. Shows on hover and
 * keyboard focus, hides on blur/leave, and Esc dismisses it without clearing the search box.
 * @component
 * @returns {React.ReactElement} The rendered component.
 */
export const SearchInfoTip = () => {
    const [isVisible, setIsVisible] = useState(false);
    const tipId = useId();

    return (
        <div
            className={styles.infoWrapper}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <button
                type="button"
                className={styles.infoButton}
                aria-label="What can I search for?"
                aria-describedby={tipId}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
                onKeyDown={(event) => {
                    if (event.key === "Escape" && isVisible) {
                        // Only dismiss the tip: the key must not bubble up and clear the search box.
                        event.stopPropagation();
                        setIsVisible(false);
                    }
                }}
                data-cy="header-search-info"
            >
                <svg
                    className="usa-icon"
                    aria-hidden="true"
                    focusable="false"
                    role="img"
                >
                    <use href={`${icons}#info_outline`}></use>
                </svg>
            </button>
            <div
                id={tipId}
                role="tooltip"
                className={styles.infoTip}
                hidden={!isVisible}
                data-cy="header-search-info-tip"
            >
                <div>You can search agreements by:</div>
                <ul>
                    {SEARCH_INFO_ITEMS.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SearchInfoTip;
