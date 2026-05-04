import { useLocation, useNavigate } from "react-router-dom";
import styles from "./DetailsTabs.module.scss";
import Tooltip from "../../UI/USWDS/Tooltip";
import { IS_AWARDED_TAB_READY, IS_DOCUMENTS_TAB_READY } from "../../../constants";

/**
 * `DetailsTabs` is a React component that renders a set of navigation tabs for agreement details and budget lines.
 * It also handles navigation and state changes related to these tabs.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {number} props.agreementId - The ID of the agreement.
 * @param {boolean} props.isAgreementNotDeveloped - Indicates whether the agreement is not developed.
 * @param {boolean} props.isAgreementAwarded - Indicates whether the agreement is awarded.
 * @param {boolean} props.isEditableForProcurementTracker - Indicates whether the current user can edit the procurement tracker.
 * @returns {JSX.Element} The rendered JSX element.
 */
const DetailsTabs = ({
    agreementId,
    isAgreementNotDeveloped,
    isAgreementAwarded,
    isEditableForProcurementTracker = true
}) => {
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
                  disabled: !IS_AWARDED_TAB_READY || !isAgreementAwarded,
                  disabledTooltip: "Award & Modifications\ntab is coming soon"
              },
              {
                  name: "/procurement-tracker",
                  label: "Procurement Tracker",
                  disabled: !isEditableForProcurementTracker,
                  disabledTooltip: "Only agreement team members can edit the procurement tracker"
              },
              {
                  name: "/documents",
                  label: "Documents",
                  disabled: !IS_DOCUMENTS_TAB_READY || !isAgreementAwarded,
                  disabledTooltip:
                      "Documents tab is coming soon. For now, please\nupload to the OPRE preferred tool to share documents"
              }
          ]
        : [];
    const paths = [...basePaths, ...developedOnlyPaths];

    const links = paths.map((path) => {
        const pathName = `/agreements/${agreementId}${path.name}`;
        const tabSelected = location.pathname == pathName;
        const button = (
            <button
                type="button"
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

        // Add tooltip if tab is disabled and has a tooltip message
        if (path.disabled && path.disabledTooltip) {
            return (
                <Tooltip
                    key={pathName}
                    label={path.disabledTooltip}
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
