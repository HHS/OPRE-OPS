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
                <div className="margin-left-2">
                    <h1 className="text-bold font-sans-lg margin-bottom-205 margin-top-205">Filters</h1>
                    <fieldset className="usa-fieldset">
                        <legend className="usa-legend font-sans-3xs">Upcoming Need By Date</legend>
                        <ul className={customStyles.noBullets}>
                            <li>
                                <input id="next-30-days" type="radio" name="upcoming-need-by-date" checked />
                                <label htmlFor="next-30-days">Next 30 days</label>
                            </li>
                            <li>
                                <input id="next-6-months" type="radio" name="upcoming-need-by-date" />
                                <label htmlFor="next-6-months">Next 6 months</label>
                            </li>
                            <li>
                                <input id="current-fy" type="radio" name="upcoming-need-by-date" />
                                <label htmlFor="current-fy">Current FY</label>
                            </li>
                            <li>
                                <input id="all-time" type="radio" name="upcoming-need-by-date" />
                                <label htmlFor="all-time">All time</label>
                            </li>
                        </ul>
                    </fieldset>
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
