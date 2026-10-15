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
 * @property {boolean} [scrollToTopOnChange=false] - When true, scrolls to the top of the page and
 *   waits for that to finish before switching tabs, instead of navigating immediately. Needed when
 *   tabs can differ a lot in content height (HomeLanding) — navigating immediately lets the
 *   browser's native scroll-clamping jump most of the way there before any animation can play,
 *   which looks like an abrupt snap. Defaults to false so other consumers (CanDetailTabs,
 *   HelpCenter) keep their existing instant-navigate behavior unchanged.
 */

/**
 * @component - Tabs
 * @param {TabsProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered JSX element.
 */
const Tabs = ({ paths, rightContent, scrollToTopOnChange = false }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Tracks at most one in-flight "scroll to top, then navigate" transition, so it can be
    // cancelled instead of firing a stale `navigate()` later — by a second tab click, by this
    // component unmounting, or by `location.pathname` changing some other way while Tabs stays
    // mounted (the browser Back button, or a link elsewhere in the same layout).
    const pendingTransitionRef = useRef(null);

    const cancelPendingTransition = () => {
        const pending = pendingTransitionRef.current;
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        cancelAnimationFrame(pending.rafId);
        pendingTransitionRef.current = null;
    };

    useEffect(() => cancelPendingTransition, [location.pathname]);

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected} margin-right-2 cursor-pointer`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected} margin-right-2 cursor-pointer`;

    const handleClick =
        /** @param {React.MouseEvent} e */
        (e) => {
            const pathName = e.currentTarget.getAttribute("data-value") || "";
            cancelPendingTransition();

            if (!scrollToTopOnChange || window.scrollY === 0) {
                navigate(pathName);
                return;
            }

            // Scroll to top and wait for it to finish before swapping the tab's content.
            // Tabs can differ a lot in height, and navigating immediately lets the browser's
            // native scroll-clamping (instant, unanimatable) jump most of the way the moment
            // the shorter content mounts — only the small remainder animates, which looks like
            // an abrupt snap instead of a smooth scroll.
            const goToTab = () => {
                cancelPendingTransition();
                navigate(pathName);
            };
            // Poll via rAF rather than a flat timeout: a flat delay either fires too early on a
            // long scroll (the snap this change is meant to fix comes right back) or wastes time
            // waiting out the full delay on a short one. Polling settles as soon as the actual
            // scroll position reaches the top, however long that takes.
            const pollForScrollEnd = () => {
                if (window.scrollY <= 0) {
                    goToTab();
                    return;
                }
                pendingTransitionRef.current.rafId = requestAnimationFrame(pollForScrollEnd);
            };
            // Safety net in case the scroll never actually settles at the top (e.g. interrupted
            // mid-flight) — without this, a stuck poll would never navigate at all.
            const timeoutId = setTimeout(goToTab, 2000);
            pendingTransitionRef.current = { timeoutId, rafId: requestAnimationFrame(pollForScrollEnd) };
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
