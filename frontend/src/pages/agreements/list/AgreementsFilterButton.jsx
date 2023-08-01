import icons from "../../../uswds/img/sprite.svg";
import React, { useEffect } from "react";
import Modal from "react-modal";
import customStyles from "./AgreementsFilterButton.module.css";
import { useGetResearchProjectsQuery } from "../../../api/opsAPI";
import ProjectSelect from "../../../components/UI/Form/ProjectSelect";
import ProjectOfficerSelect from "../../../components/UI/Form/ProjectOfficerSelect";
import AgreementTypeSelect from "../../../components/UI/Form/AgreementTypeSelect";
import ProcurementShopSelect from "../../../components/UI/Form/ProcurementShopSelect";
import _ from "lodash";

/**
 * Page for the Agreements List.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsFilterButton = ({ filters, setFilters }) => {
    const [showModal, setShowModal] = React.useState(false);
    const [project, setProject] = React.useState({});
    const [po, setPO] = React.useState({});
    const [agreementType, setAgreementType] = React.useState("");
    const [procurementShop, setProcurementShop] = React.useState({});

    const {
        data: projectData,
        error: errorProjectData,
        isLoading: isLoadingProjectData,
    } = useGetResearchProjectsQuery();

    // useEffect(() => {
    //     setFilters((prevState) => {
    //         return {
    //             ...prevState,
    //             upcomingNeedByDate: "next-30-days",
    //         };
    //     });
    // }, [setFilters]);

    const resetFilter = () => {
        setFilters({
            upcomingNeedByDate: "all-time",
            projects: [],
            projectOfficer: [],
            types: [],
            procurementShops: [],
            budgetLineStatus: {
                draft: true,
                planned: true,
                executing: true,
                obligated: true,
            },
        });
        setProject({});
        setPO({});
        setAgreementType({});
        setProcurementShop({});
    };

    const handleRadioButtons = (event) => {
        setFilters((prevState) => {
            return {
                ...prevState,
                upcomingNeedByDate: event.target.id,
            };
        });
    };

    const handleBudgetLineStatus = (event) => {
        console.log("event.target.id", event.target.id);
        setFilters((prevState) => {
            return {
                ...prevState,
                budgetLineStatus: {
                    ...prevState.budgetLineStatus,
                    [event.target.id]: event.target.checked,
                },
            };
        });
    };

    function setFilterList(prevState, filterKeyString, stateObject) {
        let updatedFilters = { ...prevState };
        let filterList = _.get(updatedFilters, filterKeyString, []);
        _.set(updatedFilters, filterKeyString, filterList);
        filterList.push(stateObject);
        _.set(
            updatedFilters,
            filterKeyString,
            filterList.filter((filter) => !_.isEmpty(filter))
        );
        _.set(updatedFilters, filterKeyString, [...new Set(_.get(updatedFilters, filterKeyString, []))]); // remove dups

        return updatedFilters;
    }

    useEffect(() => {
        setFilters((prevState) => {
            return setFilterList(prevState, "projects", project);
        });
    }, [project, setFilters]);

    useEffect(() => {
        setFilters((prevState) => {
            return setFilterList(prevState, "projectOfficers", po);
        });
    }, [po, setFilters]);

    useEffect(() => {
        setFilters((prevState) => {
            return setFilterList(prevState, "types", agreementType);
        });
    }, [agreementType, setFilters]);

    useEffect(() => {
        setFilters((prevState) => {
            return setFilterList(prevState, "procurementShops", procurementShop);
        });
    }, [procurementShop, setFilters]);

    if (isLoadingProjectData) {
        return <div>Loading...</div>;
    }
    if (errorProjectData) {
        return <div>Oops, an error occurred</div>;
    }

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
                    <fieldset className="usa-fieldset margin-bottom-205">
                        <legend className={`usa-legend font-sans-3xs ${customStyles.legendColor}`}>
                            Upcoming Need By Date
                        </legend>
                        <div className="display-flex">
                            <div className={`usa-radio padding-right-5 ${customStyles.modalBackgroundColor}`}>
                                <div className="display-flex flex-align-center padding-bottom-1">
                                    <input
                                        className="usa-radio__input height-3 width-3"
                                        id="next-30-days"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        onChange={handleRadioButtons}
                                        value={filters.upcomingNeedByDate}
                                    />
                                    <label className="usa-radio__label margin-top-0" htmlFor="next-30-days">
                                        Next 30 days
                                    </label>
                                </div>
                                <div className="display-flex flex-align-center">
                                    <input
                                        className="usa-radio__input height-3 width-3"
                                        id="current-fy"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        onChange={handleRadioButtons}
                                        value={filters.upcomingNeedByDate}
                                    />
                                    <label className="usa-radio__label margin-top-0" htmlFor="current-fy">
                                        Current FY
                                    </label>
                                </div>
                            </div>
                            <div className="">
                                <div className="display-flex flex-align-center padding-bottom-1">
                                    <input
                                        className="usa-radio__input height-3 width-3"
                                        id="next-6-months"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        onChange={handleRadioButtons}
                                        value={filters.upcomingNeedByDate}
                                    />
                                    <label className="usa-radio__label margin-top-0" htmlFor="next-6-months">
                                        Next 6 months
                                    </label>
                                </div>
                                <div className="display-flex flex-align-center">
                                    <input
                                        className="usa-radio__input height-3 width-3"
                                        id="all-time"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        onChange={handleRadioButtons}
                                        value={filters.upcomingNeedByDate}
                                        defaultChecked={filters.upcomingNeedByDate === "all-time"}
                                    />
                                    <label className="usa-radio__label margin-top-0" htmlFor="all-time">
                                        All time
                                    </label>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                    <div>
                        <fieldset className="usa-fieldset margin-bottom-205" style={{ width: "363px" }}>
                            <ProjectSelect
                                researchProjects={projectData}
                                selectedResearchProject={project || []}
                                setSelectedProject={setProject}
                                legendClassname={`usa-legend font-sans-3xs margin-top-0 ${customStyles.legendColor}`}
                                inputBoxClassname="margin-top-0"
                            />
                        </fieldset>
                    </div>
                    <div>
                        <fieldset className="usa-fieldset" style={{ width: "363px" }}>
                            <ProjectOfficerSelect
                                name="project_officer"
                                label="Project Officer"
                                className=""
                                selectedProjectOfficer={po}
                                setSelectedProjectOfficer={setPO}
                                legendClassname={`usa-legend font-sans-3xs margin-top-0 ${customStyles.legendColor}`}
                                inputBoxClassname="margin-top-0"
                            />
                        </fieldset>
                    </div>
                    <div>
                        <fieldset className="usa-fieldset margin-bottom-205" style={{ width: "363px" }}>
                            <AgreementTypeSelect
                                name="agreement_type"
                                label="Type"
                                className=""
                                selectedAgreementType={agreementType || ""}
                                onChange={(name, value) => {
                                    setAgreementType(value);
                                }}
                                legendClassname={`usa-legend font-sans-3xs margin-top-0 ${customStyles.legendColor}`}
                            />
                        </fieldset>
                    </div>
                    <div>
                        <fieldset className="usa-fieldset margin-bottom-205" style={{ width: "363px" }}>
                            <ProcurementShopSelect
                                selectedProcurementShop={procurementShop}
                                onChangeSelectedProcurementShop={setProcurementShop}
                                legendClassname={`usa-legend font-sans-3xs margin-top-0 ${customStyles.legendColor}`}
                                defaultToAll={true}
                            />
                        </fieldset>
                    </div>
                    <div>
                        <fieldset className="usa-fieldset margin-bottom-205">
                            <legend className={`usa-legend font-sans-3xs ${customStyles.legendColor}`}>
                                Budget Line Status
                            </legend>
                            <div className="display-flex">
                                <div className="padding-right-9">
                                    <div
                                        className={`usa-checkbox display-flex flex-align-center padding-bottom-1 ${customStyles.modalBackgroundColor}`}
                                    >
                                        <input
                                            className="usa-checkbox__input height-3 width-3"
                                            id="draft"
                                            type="checkbox"
                                            name="budget-line-status"
                                            defaultChecked={filters.budgetLineStatus.draft === true}
                                            onChange={handleBudgetLineStatus}
                                            checked={filters.budgetLineStatus.draft === true}
                                        />
                                        <label className="usa-checkbox__label margin-top-0" htmlFor="draft">
                                            Draft
                                        </label>
                                    </div>
                                    <div
                                        className={`usa-checkbox display-flex flex-align-center ${customStyles.modalBackgroundColor}`}
                                    >
                                        <input
                                            className="usa-checkbox__input height-3 width-3"
                                            id="planned"
                                            type="checkbox"
                                            name="budget-line-status"
                                            onChange={handleBudgetLineStatus}
                                            checked={filters.budgetLineStatus.planned === true}
                                            defaultChecked={filters.budgetLineStatus.planned === true}
                                        />
                                        <label className="usa-checkbox__label margin-top-0" htmlFor="planned">
                                            Planned
                                        </label>
                                    </div>
                                </div>
                                <div className="">
                                    <div
                                        className={`usa-checkbox display-flex flex-align-center padding-bottom-1 ${customStyles.modalBackgroundColor}`}
                                    >
                                        <input
                                            className="usa-checkbox__input height-3 width-3"
                                            id="executing"
                                            type="checkbox"
                                            name="budget-line-status"
                                            onChange={handleBudgetLineStatus}
                                            checked={filters.budgetLineStatus.executing === true}
                                            defaultChecked={filters.budgetLineStatus.executing === true}
                                        />
                                        <label className="usa-checkbox__label margin-top-0" htmlFor="executing">
                                            Executing
                                        </label>
                                    </div>
                                    <div
                                        className={`usa-checkbox display-flex flex-align-center ${customStyles.modalBackgroundColor}`}
                                    >
                                        <input
                                            className="usa-checkbox__input height-3 width-3"
                                            id="obligated"
                                            type="checkbox"
                                            name="budget-line-status"
                                            onChange={handleBudgetLineStatus}
                                            checked={filters.budgetLineStatus.obligated === true}
                                            defaultChecked={filters.budgetLineStatus.obligated === true}
                                        />
                                        <label className="usa-checkbox__label margin-top-0" htmlFor="obligated">
                                            Obligated
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    <div className="display-flex flex-justify-end padding-right-1 padding-top-1">
                        <button className="usa-button usa-button--outline" onClick={resetFilter}>
                            <span className="">Reset</span>
                        </button>
                        <button className="usa-button usa-button--primary" onClick={() => setShowModal(false)}>
                            <span>Apply</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AgreementsFilterButton;
