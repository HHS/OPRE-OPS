import React, { useEffect } from "react";
import Modal from "react-modal";
import customStyles from "./AgreementsFilterButton.module.css";
import { useGetResearchProjectsQuery } from "../../../../api/opsAPI";
import AgreementTypeSelect from "../../../../components/Agreements/AgreementTypeSelect";
import ProjectComboBox from "../../../../components/Projects/ProjectComboBox";
import ProjectOfficerComboBox from "../../../../components/Agreements/ProjectOfficerComboBox";
import FilterButton from "../../../../components/UI/FilterButton/FilterButton";
import setFilterList from "../../../../components/UI/FilterButton/utils";

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
    const [bliStatus, setBliStatus] = React.useState({
        draft: true,
        planned: true,
        executing: true,
        obligated: true
    });

    const {
        data: projectData,
        error: errorProjectData,
        isLoading: isLoadingProjectData
    } = useGetResearchProjectsQuery();

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    useEffect(() => {
        setNeedBy(filters.upcomingNeedByDate);
    }, [filters.upcomingNeedByDate]);

    useEffect(() => {
        setProject(filters.projects ? filters.projects[0] : {});
    }, [filters.projects]);


    useEffect(() => {
        setAgreementType(filters.types ? filters.types[0] : {});
    }, [filters.types]);

    useEffect(() => {
        setBliStatus(filters.budgetLineStatus);
    }, [filters.budgetLineStatus]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                upcomingNeedByDate: needBy
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
            return {
                ...prevState,
                budgetLineStatus: {
                    draft: bliStatus.draft,
                    planned: bliStatus.planned,
                    executing: bliStatus.executing,
                    obligated: bliStatus.obligated
                }
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
                obligated: true
            }
        });
        setNeedBy("all-time");
    };

    const handleBudgetLineStatus = (event) => {
        setBliStatus((prevState) => {
            return {
                ...prevState,
                [event.target.id]: event.target.checked
            };
        });
    };

    if (isLoadingProjectData) {
        return <div>Loading...</div>;
    }
    if (errorProjectData) {
        return <div>Oops, an error occurred</div>;
    }

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = `usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`;
    const checkboxStyles = `display-flex flex-align-center ${customStyles.modalBackgroundColor}`;
    const checkboxInputStyles = "usa-checkbox__input height-3 width-3";
    const checkboxLabelStyles = "usa-checkbox__label margin-top-0";

    const fieldsetList = [
        <fieldset
            key="field1"
            className={fieldStyles}
        >
            <ProjectComboBox
                researchProjects={projectData}
                selectedResearchProject={project}
                setSelectedProject={setProject}
                legendClassname={legendStyles}
                defaultString={"All Projects"}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field2"
            className="usa-fieldset"
        >
            <ProjectOfficerComboBox
                selectedProjectOfficer={po}
                setSelectedProjectOfficer={setPO}
                legendClassname={legendStyles}
                defaultString={"All Users"}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field3"
            className={`margin-top-105 ${fieldStyles}`}
            style={{ width: "22.7rem" }}
        >
            <AgreementTypeSelect
                name="agreement_type"
                label="Type"
                className=""
                selectedAgreementType={agreementType || ""}
                onChange={(name, value) => {
                    setAgreementType(value);
                }}
                legendClassname={legendStyles}
                defaultString={"All Types"}
            />
        </fieldset>,
        <fieldset
            key="field4"
            className={fieldStyles}
        >
            <legend className={legendStyles}>Budget Line Status</legend>
            <div className="display-flex">
                <div className="padding-right-9">
                    <div className={`padding-bottom-1 ${checkboxStyles}`}>
                        <input
                            className={checkboxInputStyles}
                            id="draft"
                            type="checkbox"
                            name="budget-line-status"
                            onChange={handleBudgetLineStatus}
                            checked={bliStatus.draft === true}
                        />
                        <label
                            className={checkboxLabelStyles}
                            htmlFor="draft"
                        >
                            Draft
                        </label>
                    </div>
                    <div className={checkboxStyles}>
                        <input
                            className={checkboxInputStyles}
                            id="planned"
                            type="checkbox"
                            name="budget-line-status"
                            onChange={handleBudgetLineStatus}
                            checked={bliStatus.planned === true}
                        />
                        <label
                            className={checkboxLabelStyles}
                            htmlFor="planned"
                        >
                            Planned
                        </label>
                    </div>
                </div>
                <div>
                    <div className={`padding-bottom-1 ${checkboxStyles}`}>
                        <input
                            className={checkboxInputStyles}
                            id="executing"
                            type="checkbox"
                            name="budget-line-status"
                            onChange={handleBudgetLineStatus}
                            checked={bliStatus.executing === true}
                        />
                        <label
                            className={checkboxLabelStyles}
                            htmlFor="executing"
                        >
                            Executing
                        </label>
                    </div>
                    <div className={checkboxStyles}>
                        <input
                            className={checkboxInputStyles}
                            id="obligated"
                            type="checkbox"
                            name="budget-line-status"
                            onChange={handleBudgetLineStatus}
                            checked={bliStatus.obligated === true}
                        />
                        <label
                            className={checkboxLabelStyles}
                            htmlFor="obligated"
                        >
                            Obligated
                        </label>
                    </div>
                </div>
            </div>
        </fieldset>
    ];

    Modal.setAppElement("#root");

    return (
        <FilterButton
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            fieldsetList={fieldsetList}
        />
    );
};

export default AgreementsFilterButton;
