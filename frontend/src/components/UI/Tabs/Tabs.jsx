import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import styles from "./Tabs.module.scss";

/**
 * @typedef {Object} Path
 * @property {string} label - The label to display for the tab.
 * @property {string} pathName - Link to include the / at the beginning.
 */

/**
 * @typedef {Object} TabsProps
 * @property {Path[]} paths - The paths to render as tabs.
 * @property {React.ReactNode} [rightContent] - Optional content rendered on the right side of tabs.
 */

/**
 * @component - Tabs
 * @param {TabsProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered JSX element.
 */
const Tabs = ({ paths, rightContent }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Tracks at most one in-flight "scroll to top, then navigate" transition, so a second
    // tab click (or unmounting — e.g. the user follows an unrelated link away from this page)
    // can cancel it instead of letting it fire a stale `navigate()` later.
    const pendingTransitionRef = useRef(null);

    const cancelPendingTransition = () => {
        const pending = pendingTransitionRef.current;
        if (!pending) return;
        window.removeEventListener("scrollend", pending.onScrollEnd);
        clearTimeout(pending.timeoutId);
        pendingTransitionRef.current = null;
    };

    useEffect(() => cancelPendingTransition, []);

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected} margin-right-2 cursor-pointer`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected} margin-right-2 cursor-pointer`;

    const handleClick =
        /** @param {React.MouseEvent} e */
        (e) => {
            const pathName = e.currentTarget.getAttribute("data-value") || "";
            cancelPendingTransition();

            if (window.scrollY === 0) {
                navigate(pathName);
                return;
            }

            // Scroll to top and wait for it to finish before swapping the tab's content.
            // Tabs can differ a lot in height, and navigating immediately lets the browser's
            // native scroll-clamping (instant, unanimatable) jump most of the way the moment
            // the shorter content mounts — only the small remainder animates, which looks like
            // an abrupt snap instead of a smooth scroll.
            const onScrollEnd = () => {
                cancelPendingTransition();
                navigate(pathName);
            };
            // Fallback in case `scrollend` isn't supported or never fires (e.g. the scroll
            // gets interrupted).
            const timeoutId = setTimeout(onScrollEnd, 500);
            pendingTransitionRef.current = { onScrollEnd, timeoutId };
            window.addEventListener("scrollend", onScrollEnd);
            scrollToTop();
        };

    const links = paths.map((path) => {
        const tabSelected = location.pathname == path.pathName;

        return (
            <button
                type="button"
                data-value={path.pathName}
                className={tabSelected ? selected : notSelected}
                key={path.pathName}
                onClick={handleClick}
                data-cy={`details-tab-${path.label}`}
            >
                {path.label}
            </button>
        );
    });

    return (
        <div className={styles.tabsContainer}>
            <nav
                className={`margin-bottom-4 ${styles.tabsList} ${styles.tabsNav}`}
                aria-label={"Tab Sections"}
                role={"navigation"}
            >
                {links}
            </nav>
            {rightContent && <div className={styles.tabsRightContent}>{rightContent}</div>}
        </div>
    );
};

export default Tabs;
