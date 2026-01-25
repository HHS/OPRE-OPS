import { useLocation, useNavigate } from "react-router-dom";
import styles from "./DetailsTabs.module.scss";
import Tooltip from "../../UI/USWDS/Tooltip";
import { IS_AWARDED_TAB_READY, IS_DOCUMENTS_TAB_READY, IS_PROCUREMENT_TRACKER_READY } from "../../../constants";

/**
 * `DetailsTabs` is a React component that renders a set of navigation tabs for agreement details and budget lines.
 * It also handles navigation and state changes related to these tabs.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {number} props.agreementId - The ID of the agreement.
 * @param {boolean} props.isAgreementNotDeveloped - Indicates whether the agreement is not developed.
 * @param {boolean} props.isAgreementAwarded - Indicates whether the agreement is awarded.
 * @param {boolean} props.hasInExecutionBli - Indicates whether the agreement has budget lines in execution.
 * @returns {JSX.Element} The rendered JSX element.
 */
const DetailsTabs = ({ agreementId, isAgreementNotDeveloped, isAgreementAwarded, hasInExecutionBli }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected} margin-right-2 cursor-pointer`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected} margin-right-2 cursor-pointer`;

    const isDevelopedAgreement = !isAgreementNotDeveloped;
    const basePaths = [
        {
            name: "",
            label: "Agreement Details"
        },
        {
            name: "/budget-lines",
            label: "SCs & Budget Lines"
        }
    ];
    // only show the these tabs if isAgreementAwarded for contracts
    const developedOnlyPaths = isDevelopedAgreement
        ? [
              {
                  name: "TBD1",
                  label: "Award & Modifications",
                  disabled: !IS_AWARDED_TAB_READY || !isAgreementAwarded
              },
              {
                  name: "/procurement-tracker",
                  label: "Procurement Tracker",
                  disabled: !IS_PROCUREMENT_TRACKER_READY || !hasInExecutionBli
              },
              {
                  name: "/documents",
                  label: "Documents",
                  disabled: !IS_DOCUMENTS_TAB_READY || !isAgreementAwarded
              }
          ]
        : [];
    const paths = [...basePaths, ...developedOnlyPaths];

    const links = paths.map((path) => {
        const pathName = `/agreements/${agreementId}${path.name}`;
        const tabSelected = location.pathname == pathName;
        const button = (
            <button
                data-value={pathName}
                className={`${tabSelected ? selected : notSelected} ${path.disabled ? styles.btnDisabled : ""}`}
                key={pathName}
                onClick={() => {
                    navigate(pathName);
                }}
                data-cy={`details-tab-${path.label}`}
                disabled={path.disabled}
            >
                {path.label}
            </button>
        );

        // Add tooltips for specific tabs when disabled
        if (path.disabled && ["Award & Modifications", "Documents"].includes(path.label)) {
            return (
                <Tooltip
                    key={pathName}
                    label={`${path.label} tab is coming soon`}
                    position="bottom"
                >
                    {button}
                </Tooltip>
            );
        } else if (["Procurement Tracker"].includes(path.label) && path.disabled) {
            return (
                <Tooltip
                    key={pathName}
                    label={`This page is coming soon. For now please track procurement progress \nor any budget lines in Executing Status via the OPRE spreadsheet`}
                    position="bottom"
                >
                    {button}
                </Tooltip>
            );
        }

        return button;
    });

    return (
        <nav
            className={`margin-bottom-4 ${styles.tabsList}`}
            aria-label={"Agreement Tab Sections"}
            role={"navigation"}
        >
            {links}
        </nav>
    );
};

export default DetailsTabs;
