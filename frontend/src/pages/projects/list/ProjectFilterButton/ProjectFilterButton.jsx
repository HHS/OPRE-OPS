import Modal from "react-modal";
import customStyles from "./ProjectFilterButton.module.css";
import FiscalYearComboBox from "../../../../components/UI/Form/FiscalYearComboBox";
import PortfoliosComboBox from "../../../../components/Portfolios/PortfoliosComboBox";
import ProjectTitleComboBox from "../../../../components/Projects/ProjectTitleComboBox";
import ProjectTypeComboBox from "../../../../components/Projects/ProjectTypeComboBox";
import AgreementNameComboBox from "../../../../components/Agreements/AgreementNameComboBox";
import FilterButton from "../../../../components/UI/FilterButton/FilterButton";
import useProjectFilterButton from "./ProjectFilterButton.hooks";
import { FILTER_MODAL_FULL_WIDTH } from "../../../../constants";
import { useEffect } from "react";
import React from "react";

/**
 * A filter for projects.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {Object} props.projectFilterOptions - The filter options from API.
 * @param {boolean} [props.isLoadingOptions] - Whether the filter options are loading.
 * @returns {JSX.Element} - The project filter button component.
 */
export const ProjectFilterButton = ({ filters, setFilters, projectFilterOptions, isLoadingOptions = false }) => {
    const [showModal, setShowModal] = React.useState(false);

    const {
        fiscalYear,
        setFiscalYear,
        portfolio,
        setPortfolio,
        projectSearch,
        setProjectSearch,
        agreementSearch,
        setAgreementSearch,
        projectType,
        setProjectType,
        applyFilter,
        resetFilter,
        currentFiscalYear
    } = useProjectFilterButton(filters, setFilters, showModal);

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = `usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`;

    const fieldsetList = [
        <fieldset
            key="fiscalYearField"
            className={`margin-top-105 ${fieldStyles}`}
        >
            <FiscalYearComboBox
                selectedFiscalYears={fiscalYear}
                setSelectedFiscalYears={setFiscalYear}
                legendClassname={legendStyles}
                defaultString={`Fiscal Year ${currentFiscalYear}`}
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
                budgetLinesFiscalYears={projectFilterOptions?.fiscal_years || []}
                label="Compare Fiscal Years"
                includeAllOption={true}
                isLoading={isLoadingOptions}
            />
        </fieldset>,
        <fieldset
            key="portfolioField"
            className="usa-fieldset"
        >
            <PortfoliosComboBox
                portfolioOptions={projectFilterOptions?.portfolios ?? []}
                usePrefetchedOptions={true}
                selectedPortfolios={portfolio}
                setSelectedPortfolios={setPortfolio}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
                isLoading={isLoadingOptions}
            />
        </fieldset>,
        <fieldset
            key="projectSearchField"
            className={`margin-top-105 ${fieldStyles}`}
        >
            <ProjectTitleComboBox
                selectedProjects={projectSearch}
                setSelectedProjects={setProjectSearch}
                agreementFilterOptions={projectFilterOptions}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
                isLoading={isLoadingOptions}
                filterLabel={"Project Title or Nickname"}
            />
        </fieldset>,
        <fieldset
            key="projectTypeField"
            className={`margin-top-105 ${fieldStyles}`}
        >
            <ProjectTypeComboBox
                selectedProjectTypes={projectType}
                setSelectedProjectTypes={setProjectType}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
            />
        </fieldset>,
        <fieldset
            key="agreementSearchField"
            className={`margin-top-105 ${fieldStyles}`}
        >
            <AgreementNameComboBox
                selectedAgreementNames={agreementSearch}
                setSelectedAgreementNames={setAgreementSearch}
                agreementNameOptions={projectFilterOptions?.agreement_names ?? []}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
                isLoading={isLoadingOptions}
                filterLabel="Agreement Title or Nickname"
            />
        </fieldset>
    ];

    useEffect(() => {
        Modal.setAppElement("#root");
    }, []);
    return (
        <FilterButton
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            fieldsetList={fieldsetList}
            showModal={showModal}
            setShowModal={setShowModal}
        />
    );
};

export default ProjectFilterButton;
