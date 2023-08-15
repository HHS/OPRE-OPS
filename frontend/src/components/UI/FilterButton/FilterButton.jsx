import icons from "../../../uswds/img/sprite.svg";
import React from "react";
import Modal from "react-modal";
import customStyles from "./FilterButton.module.css";

/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Function} props.applyFilter - A function to call after clicking the Apply button.
 * @param {Function} props.resetFilter - A function to call after clicking the Reset button.
 * @param {array} props.fieldsetList - An array of fieldsets to display in the modal.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const FilterButton = ({ applyFilter, resetFilter, fieldsetList }) => {
    const [showModal, setShowModal] = React.useState(false);

    const handleApplyFilter = () => {
        applyFilter();
        setShowModal(false);
    };

    const handleResetFilter = () => {
        resetFilter();
        // setShowModal(false);
    };

    Modal.setAppElement("#root");

    return (
        <div className={customStyles.container} id="filter-container">
            <button
                className={`usa-button display-flex flex-align-center ${customStyles.filterButton} margin-right-0`}
                onClick={() => (showModal ? setShowModal(false) : setShowModal(true))}
            >
                <svg
                    className="height-2 width-2 margin-right-05 hover: cursor-pointer usa-tooltip"
                    style={{ fill: "white" }}
                >
                    <use xlinkHref={`${icons}#filter_list`}></use>
                </svg>
                <span>Filters</span>
            </button>
            <Modal
                isOpen={showModal}
                onRequestClose={() => setShowModal(false)}
                parentSelector={() => document.querySelector("#filter-container")}
                className={`${customStyles.agreementsFilterModal} ${customStyles.modalBackgroundColor}`}
                overlayClassName={customStyles.agreementsFilterOverlay}
            >
                <div className="margin-left-2">
                    <h1 className="text-bold font-sans-lg margin-bottom-205 margin-top-205">Filters</h1>
                    {fieldsetList?.map((formField) => formField)}
                </div>
                <div className="display-flex flex-justify-end padding-right-1 padding-top-1">
                    <button className="usa-button usa-button--outline" onClick={handleResetFilter}>
                        <span className="">Reset</span>
                    </button>
                    <button className="usa-button usa-button--primary" onClick={handleApplyFilter}>
                        <span>Apply</span>
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default FilterButton;
