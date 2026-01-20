import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import styles from "./DetailsTabs.module.scss";
import Tooltip from "../../UI/USWDS/Tooltip";

/**
 * `DetailsTabs` is a React component that renders a set of navigation tabs for agreement details and budget lines.
 * It also handles navigation and state changes related to these tabs.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {boolean} props.hasAgreementChanged - Indicates whether the agreement has changed.
 * @param {Function} props.setHasAgreementChanged - Function to set the `hasAgreementChanged` state.
 * @param {number} props.agreementId - The ID of the agreement.
 * @param {boolean} props.isEditMode - Indicates whether the component is in edit mode.
 * @param {boolean} props.isAgreementNotDeveloped - Indicates whether the agreement is not developed.
 * @param {boolean} props.isAgreementAwarded - Indicates whether the agreement is awarded.
 * @param {Function} props.setIsEditMode - Function to set the `isEditMode` state.
 * @returns {JSX.Element} The rendered JSX element.
 */
const DetailsTabs = ({
    hasAgreementChanged,
    setHasAgreementChanged,
    agreementId,
    isEditMode,
    setIsEditMode,
    isAgreementNotDeveloped,
    isAgreementAwarded
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected} margin-right-2 cursor-pointer`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected} margin-right-2 cursor-pointer`;

    const paths = [
        {
            name: "",
            label: "Agreement Details"
        },
        {
            name: "/budget-lines",
            label: "SCs & Budget Lines"
        },
        // only show the these tabs if isAgreementAwarded for contracts
        ...(!isAgreementNotDeveloped && isAgreementAwarded
            ? [
                  {
                      name: "TBD1",
                      label: "Award & Modifications",
                      disabled: isAgreementAwarded
                  }
              ]
            : []),
        ...(isAgreementAwarded
            ? [
                  {
                      name: "/procurement-tracker",
                      label: "Procurement Tracker"
                      //   disabled: isAgreementAwarded
                  }
              ]
            : []),

        // Hide the "Documents" tab if isAgreementNotDeveloped is true
        ...(!isAgreementNotDeveloped && isAgreementAwarded
            ? [
                  {
                      name: "/documents",
                      label: "Documents",
                      disabled: isAgreementAwarded
                  }
              ]
            : [])
    ];

    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});

    const cleanUp = () => {
        setHasAgreementChanged(false);
        setIsEditMode(false);
    };

    const handleClick = (e) => {
        const pathName = e.currentTarget.getAttribute("data-value");
        if (!isEditMode) navigate(pathName);
        else if (!hasAgreementChanged) {
            navigate(pathName);
        } else {
            setShowModal(true);
            setModalProps({
                heading: "Are you sure you want to leave this page without saving it? Your changes will not be saved. ",
                actionButtonText: "Leave the Page",
                secondaryButtonText: "Continue Editing",
                handleConfirm: () => {
                    cleanUp();
                    navigate(pathName);
                }
            });
        }
    };

    const links = paths.map((path) => {
        const pathName = `/agreements/${agreementId}${path.name}`;
        const tabSelected = location.pathname == pathName;
        const button = (
            <button
                data-value={pathName}
                className={`${tabSelected ? selected : notSelected} ${path.disabled ? styles.btnDisabled : ""}`}
                key={pathName}
                onClick={handleClick}
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
                    label="This page is coming soon"
                    position="bottom"
                >
                    {button}
                </Tooltip>
            );
        } else if (["Procurement Tracker"].includes(path.label)) {
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
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
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

export default DetailsTabs;
