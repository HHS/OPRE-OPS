import icons from "../../../uswds/img/sprite.svg";
import React from "react";
import Modal from "react-modal";
import customStyles from "./AgreementsFilterButton.module.css";

/**
 * Page for the Agreements List.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsFilterButton = ({ setFilterFunctions }) => {
    const [showModal, setShowModal] = React.useState(false);

    Modal.setAppElement("#root");

    return (
        <div className={customStyles.container} id="filter-container">
            <button
                className={`usa-button display-flex flex-align-center ${customStyles.filterButton}`}
                onClick={() => setShowModal(true)}
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
                className={customStyles.agreementsFilterModal}
                overlayClassName={customStyles.agreementsFilterOverlay}
            >
                <div className="">
                    <h1 className={`text-bold`}>Filters</h1>
                    <div>
                        <h3>Upcoming Need By Date</h3>
                    </div>
                    <div>
                        <h3>Project</h3>
                    </div>
                    <div>
                        <h3>Project Officer</h3>
                    </div>
                    <div>
                        <h3>Type</h3>
                    </div>
                    <div>
                        <h3>Procurement Shop</h3>
                    </div>
                    <div>
                        <h3>Budget Line Status</h3>
                    </div>
                    <div>
                        <button onClick={() => setShowModal(false)}>
                            <span>Reset</span>
                        </button>
                        <button onClick={() => setShowModal(false)}>
                            <span>Apply</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AgreementsFilterButton;
