import icons from "../../../uswds/img/sprite.svg";
import React from "react";
import Modal from "react-modal";
import customStyles from "./FilterButton.module.css";

/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Function} props.applyFilter - A function to call after clicking the Apply button.
 * @param {Function} props.resetFilter - A function to call after clicking the Reset button.
 * @param {Object []} props.fieldsetList - An array of fieldsets to display in the modal.
 * @param {boolean} props.disabled - Whether the button is disabled.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const FilterButton = ({ applyFilter, resetFilter, fieldsetList, disabled = false }) => {
    const [showModal, setShowModal] = React.useState(false);

    const handleApplyFilter = () => {
        applyFilter();
        setShowModal(false);
    };

    const handleResetFilter = () => {
        resetFilter();
    };

    Modal.setAppElement("#root");

    console.log('Hello I am here');
    return (
        <div
            className={customStyles.container}
            id="filter-container"
        >
            <button
                className={`usa-button ${
                    !showModal ? "usa-button--outline text-primary" : "bg-primary-darker"
                } display-flex flex-align-center margin-right-0 ${customStyles.filterButton}`}
                onClick={() => (showModal ? setShowModal(false) : setShowModal(true))}
                disabled={disabled}
            >
                <svg
                    className={`height-2 width-2 margin-right-05 ${!disabled ? "cursor-pointer" : ""}`}
                    style={disabled ? { fill: "grey" } : !showModal ? { fill: "#005EA2" } : { fill: "white" }}
                >
                    <use xlinkHref={`${icons}#filter_list`}></use>
                </svg>
                <span>Filters</span>
            </button>
            <Modal
                isOpen={showModal}
                onRequestClose={() => setShowModal(false)}
                parentSelector={() => document.querySelector("#filter-container")}
                className={`${customStyles.filterModal} ${customStyles.modalBackgroundColor}`}
                overlayClassName={customStyles.filterOverlay}
            >
                <div className="margin-left-2">
                    <div className="display-flex flex-justify-space-between">
                        <h1 className="text-bold font-sans-lg margin-bottom-205 margin-top-205">Filters</h1>
                        <div className="margin-top-205 margin-right-205 padding-08">
                            <svg
                                className="usa-icon text-ink height-205 width-205 cursor-pointer"
                                onClick={() => setShowModal(false)}
                                id="filter-close"
                            >
                                <use xlinkHref={`${icons}#close`}></use>
                            </svg>
                        </div>
                    </div>
                    {fieldsetList?.map((formField) => formField)}
                </div>
                <div className="display-flex flex-justify-end padding-right-1 padding-top-1 padding-bottom-1">
                    <button
                        className="usa-button usa-button--outline"
                        onClick={handleResetFilter}
                    >
                        <span className="">Reset</span>
                    </button>
                    <button
                        className="usa-button usa-button--primary"
                        onClick={handleApplyFilter}
                    >
                        <span>Apply</span>
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default FilterButton;
