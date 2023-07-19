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
    const buttonRef = React.useRef(null);

    const getModalParent = () => buttonRef.current;

    Modal.setAppElement("#root");

    return (
        <div className={customStyles.container}>
            <button
                className={`usa-button display-flex flex-align-center ${customStyles.filterButton}`}
                onClick={() => setShowModal(true)}
                ref={buttonRef}
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
                parentSelector={getModalParent}
                className={customStyles.agreementsFilterModal}
                overlayClassName={customStyles.agreementsFilterOverlay}
            >
                <div>
                    <h1 className="text-bold">Filters</h1>
                    <h3>Upcoming Need By Date</h3>
                    <h3>Project</h3>
                    <h3>Project Officer</h3>
                    <h3>Type</h3>
                    <h3>Procurement Shop</h3>
                    <h3>Budget Line Status</h3>
                    <button onClick={() => setShowModal(false)}>
                        <span>Reset</span>
                    </button>
                    <button onClick={() => setShowModal(false)}>
                        <span>Apply</span>
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AgreementsFilterButton;
