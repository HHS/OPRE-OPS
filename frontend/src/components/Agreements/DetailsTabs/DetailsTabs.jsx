import React from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import styles from "./DetailsTabs.module.scss";

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
 * @param {Function} props.setIsEditMode - Function to set the `isEditMode` state.
 *
 * @returns {JSX.Element} The rendered JSX element.
 */
const DetailsTabs = ({ hasAgreementChanged, setHasAgreementChanged, agreementId, isEditMode, setIsEditMode }) => {
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
        {
            name: "/documents",
            label: "Documents"
        }
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

DetailsTabs.propTypes = {
    hasAgreementChanged: PropTypes.bool.isRequired,
    setHasAgreementChanged: PropTypes.func.isRequired,
    agreementId: PropTypes.number.isRequired,
    isEditMode: PropTypes.bool.isRequired,
    setIsEditMode: PropTypes.func.isRequired
};

export default DetailsTabs;
