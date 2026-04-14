import { useLocation, useNavigate } from "react-router-dom";
import styles from "../../../components/Agreements/DetailsTabs/DetailsTabs.module.scss";
import Tooltip from "../../../components/UI/USWDS/Tooltip";

const TABS = [
    { name: "", label: "Project Details" },
    {
        name: "/spending",
        label: "Project Spending",
        disabled: true,
        disabledTooltip: "Coming Soon"
    },
    {
        name: "/funding",
        label: "Project Funding",
        disabled: true,
        disabledTooltip: "Coming Soon"
    }
];

/**
 * Navigation tabs for the project detail page.
 * @param {Object} props
 * @param {number} props.projectId - The ID of the project.
 * @returns {React.ReactElement}
 */
const ProjectDetailTabs = ({ projectId }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected} margin-right-2 cursor-pointer`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected} margin-right-2 cursor-pointer`;

    return (
        <nav
            className={`margin-bottom-4 ${styles.tabsList}`}
            aria-label="Project Tab Sections"
            role="navigation"
        >
            {TABS.map((tab) => {
                const pathName = `/projects/${projectId}${tab.name}`;
                const isSelected = location.pathname === pathName;
                const button = (
                    <button
                        type="button"
                        key={pathName}
                        className={`${isSelected ? selected : notSelected} ${tab.disabled ? styles.btnDisabled : ""}`}
                        onClick={() => navigate(pathName)}
                        disabled={tab.disabled}
                        data-cy={`project-tab-${tab.label}`}
                    >
                        {tab.label}
                    </button>
                );

                if (tab.disabled && tab.disabledTooltip) {
                    return (
                        <Tooltip
                            key={pathName}
                            label={tab.disabledTooltip}
                            position="top"
                        >
                            {button}
                        </Tooltip>
                    );
                }

                return button;
            })}
        </nav>
    );
};

export default ProjectDetailTabs;
