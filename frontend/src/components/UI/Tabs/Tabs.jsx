import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTrailNavigate } from "../../../hooks/useBreadcrumbTrail.hooks";
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
 *
 * Switching tabs keeps the current breadcrumb trail when the tabs are pages of
 * the same resource (see `useTrailNavigate`), and keeps the page's scroll position
 * instead of jumping to the top.
 *
 * @param {TabsProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered JSX element.
 */
const Tabs = ({ paths, rightContent }) => {
    const location = useLocation();
    const navigate = useTrailNavigate();
    const navRef = useRef(null);
    const clickedPathRef = useRef(null);

    // Runs once the new tab has rendered: a shorter tab makes the browser clamp the scroll position,
    // which can leave the tab bar above the viewport. Only for tab clicks, so Back/Forward keeps the
    // position ScrollRestoration restores.
    useLayoutEffect(() => {
        if (clickedPathRef.current !== location.pathname) return;
        clickedPathRef.current = null;

        const nav = navRef.current;
        if (!nav || nav.getBoundingClientRect().top >= 0) return;

        // No `behavior`: the global `scroll-behavior` CSS animates it, except under prefers-reduced-motion.
        nav.scrollIntoView({ block: "start" });
    }, [location.pathname]);

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected} margin-right-2 cursor-pointer`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected} margin-right-2 cursor-pointer`;

    const handleClick =
        /** @param {React.MouseEvent} e */
        (e) => {
            const pathName = e.currentTarget.getAttribute("data-value") || "";
            // Clicking the already-active tab would navigate without changing location.pathname,
            // so the effect above (keyed on location.pathname) would never clear clickedPathRef —
            // leaving it stuck and able to fire scrollIntoView on a later, unrelated Back/Forward.
            if (pathName === location.pathname) return;
            clickedPathRef.current = pathName;
            navigate(pathName, { preventScrollReset: true });
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
                ref={navRef}
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
