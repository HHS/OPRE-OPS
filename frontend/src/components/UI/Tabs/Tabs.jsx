import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Tabs.module.scss";

/**
 * @typedef {Object} Path
 * @property {string} label
 * @property {string} pathName
 */

/**
 * @typedef {Object} TabsProps
 * @property {Path[]} paths - The paths to render as tabs.
 */

/**
 * @component - Tabs
 * @param {TabsProps} props - The properties passed to the component.
 * @returns {JSX.Element} The rendered JSX element.
 */
const Tabs = ({ paths }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected} margin-right-2 cursor-pointer`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected} margin-right-2 cursor-pointer`;

    const handleClick =
        /** @param {React.MouseEvent} e */
        (e) => {
            const pathName = e.currentTarget.getAttribute("data-value") || "";
            navigate(pathName);
        };

    const links = paths.map((path) => {
        const tabSelected = location.pathname == path.pathName;

        return (
            <button
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
        <>
            <nav
                className={`margin-bottom-4 ${styles.tabsList}`}
                aria-label={"Agreement Tab Sections"}
                role={"navigation"}
            >
                {links}
            </nav>
        </>
    );
};

export default Tabs;
