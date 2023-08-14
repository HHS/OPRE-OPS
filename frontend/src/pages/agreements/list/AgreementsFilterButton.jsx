import icons from "../../../uswds/img/sprite.svg";
import React, { useEffect } from "react";
import Modal from "react-modal";
import customStyles from "./AgreementsFilterButton.module.css";
import { useGetResearchProjectsQuery } from "../../../api/opsAPI";
import AgreementTypeSelect from "../../../components/UI/Form/AgreementTypeSelect";
import ProcurementShopSelect from "../../../components/UI/Form/ProcurementShopSelect";
import _ from "lodash";
import ProjectComboBox from "../../../components/UI/Form/ProjectComboBox";
import ProjectOfficerComboBox from "../../../components/UI/Form/ProjectOfficerComboBox";

/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const AgreementsFilterButton = ({ filters, setFilters }) => {
    const [showModal, setShowModal] = React.useState(false);
    const [needBy, setNeedBy] = React.useState("all-time");
    const [project, setProject] = React.useState({});
    const [po, setPO] = React.useState({});
    const [agreementType, setAgreementType] = React.useState("");
    const [procurementShop, setProcurementShop] = React.useState({});
    const [bliStatus, setBliStatus] = React.useState({
        draft: true,
        planned: true,
        executing: true,
        obligated: true,
    });

    const {
        data: projectData,
        error: errorProjectData,
        isLoading: isLoadingProjectData,
    } = useGetResearchProjectsQuery();

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    useEffect(() => {
        setNeedBy(filters.upcomingNeedByDate);
    }, [filters.upcomingNeedByDate]);

    useEffect(() => {
        setProject(filters.projects ? filters.projects[0] : {});
    }, [filters.projects]);

    useEffect(() => {
        setPO(filters.projectOfficers ? filters.projectOfficers[0] : {});
    }, [filters.projectOfficers]);

    useEffect(() => {
        setAgreementType(filters.types ? filters.types[0] : {});
    }, [filters.types]);

    useEffect(() => {
        setProcurementShop(filters.procurementShops ? filters.procurementShops[0] : {});
    }, [filters.procurementShops]);

    useEffect(() => {
        setBliStatus(filters.budgetLineStatus);
    }, [filters.budgetLineStatus]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                upcomingNeedByDate: needBy,
            };
        });
        setFilters((prevState) => {
            return setFilterList(prevState, "projects", project, true);
        });
        setFilters((prevState) => {
            return setFilterList(prevState, "projectOfficers", po, true);
        });
        setFilters((prevState) => {
            return setFilterList(prevState, "types", agreementType);
        });
        setFilters((prevState) => {
            return setFilterList(prevState, "procurementShops", procurementShop);
        });
        setFilters((prevState) => {
            return {
                ...prevState,
                budgetLineStatus: {
                    draft: bliStatus.draft,
                    planned: bliStatus.planned,
                    executing: bliStatus.executing,
                    obligated: bliStatus.obligated,
                },
            };
        });
        setShowModal(false);
    };

    const resetFilter = () => {
        setFilters({
            upcomingNeedByDate: "all-time",
            projects: [],
            projectOfficers: [],
            types: [],
            procurementShops: [],
            budgetLineStatus: {
                draft: true,
                planned: true,
                executing: true,
                obligated: true,
            },
        });
        setNeedBy("all-time");
    };

    const handleBudgetLineStatus = (event) => {
        setBliStatus((prevState) => {
            return {
                ...prevState,
                [event.target.id]: event.target.checked,
            };
        });
    };

    function setFilterList(prevState, filterKeyString, stateObject, onlyAllowOne = false) {
        let updatedFilters = { ...prevState };
        let filterList = _.get(updatedFilters, filterKeyString, []);
        _.set(updatedFilters, filterKeyString, filterList);
        if (onlyAllowOne) {
            filterList[0] = stateObject;
        } else {
            filterList.push(stateObject);
        }
        _.set(
            updatedFilters,
            filterKeyString,
            filterList.filter((filter) => !_.isEmpty(filter))
        );
        _.set(updatedFilters, filterKeyString, [...new Set(_.get(updatedFilters, filterKeyString, []))]); // remove dups

        return updatedFilters;
    }

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
                                <div className="display-flex flex-align-center padding-top-05 padding-bottom-105">
                                    <input
                                        className="usa-radio__input height-3 width-3"
                                        id="next-30-days"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        tabIndex={0}
                                        onChange={() => setNeedBy("next-30-days")}
                                        checked={needBy === "next-30-days"}
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
                                        tabIndex={0}
                                        onChange={() => setNeedBy("current-fy")}
                                        checked={needBy === "current-fy"}
                                    />
                                    <label className="usa-radio__label margin-top-0" htmlFor="current-fy">
                                        Current FY
                                    </label>
                                </div>
                            </div>
                            <div className="">
                                <div className="display-flex flex-align-center padding-top-05 padding-bottom-105">
                                    <input
                                        className="usa-radio__input height-3 width-3"
                                        id="next-6-months"
                                        type="radio"
                                        name="upcoming-need-by-date"
                                        tabIndex={0}
                                        onChange={() => setNeedBy("next-6-months")}
                                        checked={needBy === "next-6-months"}
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
                                        tabIndex={0}
                                        onChange={() => setNeedBy("all-time")}
                                        checked={needBy === "all-time"}
                                    />
                                    <label className="usa-radio__label margin-top-0" htmlFor="all-time">
                                        All time
                                    </label>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                    <div>
                        <fieldset className="usa-fieldset margin-bottom-205">
                            <ProjectComboBox
                                researchProjects={projectData}
                                selectedResearchProject={project}
                                setSelectedProject={setProject}
                                legendClassname={`usa-legend font-sans-3xs margin-top-0 ${customStyles.legendColor}`}
                                defaultString={"All Projects"}
                                overrideStyles={{ width: "22.7rem" }}
                            />
                        </fieldset>
                    </div>
                    <div>
                        <fieldset className="usa-fieldset">
                            <ProjectOfficerComboBox
                                selectedProjectOfficer={po}
                                setSelectedProjectOfficer={setPO}
                                legendClassname={`usa-legend font-sans-3xs margin-top-0 ${customStyles.legendColor}`}
                                defaultString={"All Users"}
                                overrideStyles={{ width: "22.7rem" }}
                            />
                        </fieldset>
                    </div>
                    <div>
                        <fieldset className="usa-fieldset margin-bottom-205" style={{ width: "22.7rem" }}>
                            <AgreementTypeSelect
                                name="agreement_type"
                                label="Type"
                                className=""
                                selectedAgreementType={agreementType || ""}
                                onChange={(name, value) => {
                                    setAgreementType(value);
                                }}
                                legendClassname={`usa-legend font-sans-3xs margin-top-0 ${customStyles.legendColor}`}
                                defaultString={"All Types"}
                            />
                        </fieldset>
                    </div>
                    <div>
                        <fieldset className="usa-fieldset margin-bottom-205" style={{ width: "363px" }}>
                            <ProcurementShopSelect
                                selectedProcurementShop={procurementShop}
                                onChangeSelectedProcurementShop={setProcurementShop}
                                legendClassname={`usa-legend font-sans-3xs margin-top-0 ${customStyles.legendColor}`}
                                defaultString={"All Shops"}
                                defaultToGCS={false}
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
                                        className={`usa-checkbox display-flex flex-align-center padding-top-05 padding-bottom-105 ${customStyles.modalBackgroundColor}`}
                                    >
                                        <input
                                            className="usa-checkbox__input height-3 width-3"
                                            id="draft"
                                            type="checkbox"
                                            name="budget-line-status"
                                            onChange={handleBudgetLineStatus}
                                            checked={bliStatus.draft === true}
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
                                            checked={bliStatus.planned === true}
                                        />
                                        <label className="usa-checkbox__label margin-top-0" htmlFor="planned">
                                            Planned
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div
                                        className={`usa-checkbox display-flex flex-align-center padding-top-05 padding-bottom-105 ${customStyles.modalBackgroundColor}`}
                                    >
                                        <input
                                            className="usa-checkbox__input height-3 width-3"
                                            id="executing"
                                            type="checkbox"
                                            name="budget-line-status"
                                            onChange={handleBudgetLineStatus}
                                            checked={bliStatus.executing === true}
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
                                            checked={bliStatus.obligated === true}
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
                        <button className="usa-button usa-button--primary" onClick={applyFilter}>
                            <span>Apply</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AgreementsFilterButton;
