import React, { useEffect } from "react";
import Modal from "react-modal";
import customStyles from "./AgreementsFilterButton.module.css";
import { useGetResearchProjectsQuery } from "../../../api/opsAPI";
import AgreementTypeSelect from "../../../components/UI/Form/AgreementTypeSelect";
import ProcurementShopSelect from "../../../components/UI/Form/ProcurementShopSelect";
import ProjectComboBox from "../../../components/UI/Form/ProjectComboBox";
import ProjectOfficerComboBox from "../../../components/UI/Form/ProjectOfficerComboBox";
import FilterButton from "../../../components/UI/FilterButton/FilterButton";
import setFilterList from "../../../components/UI/FilterButton/utils";

/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const AgreementsFilterButton = ({ filters, setFilters }) => {
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

    if (isLoadingProjectData) {
        return <div>Loading...</div>;
    }
    if (errorProjectData) {
        return <div>Oops, an error occurred</div>;
    }

    const fieldsetList = [
        <fieldset key="field1" className="usa-fieldset margin-bottom-205">
            <legend className={`usa-legend font-sans-3xs padding-bottom-1 ${customStyles.legendColor}`}>
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
                    <div className="display-flex flex-align-center padding-bottom-1">
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
        </fieldset>,
        <fieldset key="field2" className="usa-fieldset margin-bottom-205">
            <ProjectComboBox
                researchProjects={projectData}
                selectedResearchProject={project}
                setSelectedProject={setProject}
                legendClassname={`usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`}
                defaultString={"All Projects"}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset key="field3" className="usa-fieldset">
            <ProjectOfficerComboBox
                selectedProjectOfficer={po}
                setSelectedProjectOfficer={setPO}
                legendClassname={`usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`}
                defaultString={"All Users"}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset key="field4" className="usa-fieldset margin-bottom-205" style={{ width: "22.7rem" }}>
            <AgreementTypeSelect
                name="agreement_type"
                label="Type"
                className=""
                selectedAgreementType={agreementType || ""}
                onChange={(name, value) => {
                    setAgreementType(value);
                }}
                legendClassname={`usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`}
                defaultString={"All Types"}
            />
        </fieldset>,
        <fieldset key="field5" className="usa-fieldset margin-bottom-205" style={{ width: "363px" }}>
            <ProcurementShopSelect
                selectedProcurementShop={procurementShop}
                onChangeSelectedProcurementShop={setProcurementShop}
                legendClassname={`usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`}
                defaultString={"All Shops"}
                defaultToGCS={false}
            />
        </fieldset>,
        <fieldset key="field6" className="usa-fieldset margin-bottom-205">
            <legend className={`usa-legend font-sans-3xs padding-bottom-1 ${customStyles.legendColor}`}>
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
                            onChange={handleBudgetLineStatus}
                            checked={bliStatus.draft === true}
                        />
                        <label className="usa-checkbox__label margin-top-0" htmlFor="draft">
                            Draft
                        </label>
                    </div>
                    <div className={`usa-checkbox display-flex flex-align-center ${customStyles.modalBackgroundColor}`}>
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
                        className={`usa-checkbox display-flex flex-align-center padding-bottom-1 ${customStyles.modalBackgroundColor}`}
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
                    <div className={`usa-checkbox display-flex flex-align-center ${customStyles.modalBackgroundColor}`}>
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
        </fieldset>,
    ];

    Modal.setAppElement("#root");

    return <FilterButton applyFilter={applyFilter} resetFilter={resetFilter} fieldsetList={fieldsetList} />;
};

export default AgreementsFilterButton;
