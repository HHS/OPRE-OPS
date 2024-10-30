import { useLocation, useNavigate } from "react-router-dom";
import styles from "../../Agreements/DetailsTabs/DetailsTabs.module.scss";

/**
 * @typedef {Object} CanDetailTabsProps
 * @property {number} canId - The ID of the CAN.
 */

/**
 * @component - Can Detail Tabs
 * @param {CanDetailTabsProps} props - The properties passed to the component.
 * @returns {JSX.Element} The rendered JSX element.
 */
const CanDetailTabs = ({ canId }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected} margin-right-2 cursor-pointer`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected} margin-right-2 cursor-pointer`;

    const paths = [
        {
            name: "",
            label: "CAN Details"
        },
        {
            name: "/spending",
            label: "CAN Spending"
        },
        {
            name: "/funding",
            label: "CAN Funding"
        }
    ];

    const handleClick = (e) => {
        const pathName = e.currentTarget.getAttribute("data-value");
        navigate(pathName);
    };

    const links = paths.map((path) => {
        const pathName = `/cans/${canId}${path.name}`;
        const tabSelected = location.pathname == pathName;

        return (
            <button
                data-value={pathName}
                className={tabSelected ? selected : notSelected}
                key={pathName}
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

export default CanDetailTabs;
