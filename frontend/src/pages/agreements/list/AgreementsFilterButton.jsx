import icons from "../../../uswds/img/sprite.svg";
import React, { useEffect } from "react";
import Modal from "react-modal";
import customStyles from "./AgreementsFilterButton.module.css";

/**
 * Page for the Agreements List.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsFilterButton = ({ filters, setFilters }) => {
    const [showModal, setShowModal] = React.useState(false);

    Modal.setAppElement("#root");

    useEffect(() => {
        setFilters((prevState) => {
            return {
                ...prevState,
                upcomingNeedByDate: "next-30-days",
            };
        });
    }, [setFilters]);

    const handleRadioButtons = (event) => {
        setFilters((prevState) => {
            return {
                ...prevState,
                upcomingNeedByDate: event.target.id,
            };
        });
    };

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
                        <legend className={`usa-legend font-sans-3xs ${customStyles.legendColor}`}>
                            Upcoming Need By Date
                        </legend>
                        <div className="display-flex">
                            <div className="padding-right-5">
                                <div className="display-flex flex-align-center padding-bottom-1">
                                    <input
                                        className="height-3 width-3"
                                        id="next-30-days"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        defaultChecked={filters.upcomingNeedByDate === "next-30-days"}
                                        onChange={handleRadioButtons}
                                        value={filters.upcomingNeedByDate}
                                    />
                                    <label className="padding-left-1" htmlFor="next-30-days">
                                        Next 30 days
                                    </label>
                                </div>
                                <div className="display-flex flex-align-center">
                                    <input
                                        className="height-3 width-3"
                                        id="current-fy"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        onChange={handleRadioButtons}
                                        value={filters.upcomingNeedByDate}
                                    />
                                    <label className="padding-left-1" htmlFor="current-fy">
                                        Current FY
                                    </label>
                                </div>
                            </div>
                            <div className="">
                                <div className="display-flex flex-align-center padding-bottom-1">
                                    <input
                                        className="height-3 width-3"
                                        id="next-6-months"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        onChange={handleRadioButtons}
                                        value={filters.upcomingNeedByDate}
                                    />
                                    <label className="padding-left-1" htmlFor="next-6-months">
                                        Next 6 months
                                    </label>
                                </div>
                                <div className="display-flex flex-align-center">
                                    <input
                                        className="height-3 width-3"
                                        id="all-time"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        onChange={handleRadioButtons}
                                        value={filters.upcomingNeedByDate}
                                    />
                                    <label className="padding-left-1" htmlFor="all-time">
                                        All time
                                    </label>
                                </div>
                            </div>
                        </div>
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
