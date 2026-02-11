import Modal from "react-modal";
import customStyles from "./AgreementsFilterButton.module.css";
import FiscalYearComboBox from "../../../../components/UI/Form/FiscalYearComboBox";
import PortfoliosComboBox from "../../../../components/Portfolios/PortfoliosComboBox";
import ProjectTitleComboBox from "../../../../components/Projects/ProjectTitleComboBox";
import AgreementTypeComboBox from "../../../../components/Agreements/AgreementTypeComboBox";
import AgreementNameComboBox from "../../../../components/Agreements/AgreementNameComboBox";
import ContractNumberComboBox from "../../../../components/Agreements/ContractNumberComboBox";
import FilterButton from "../../../../components/UI/FilterButton/FilterButton";
import useAgreementsFilterButton from "./AgreementsFilterButton.hooks";
/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {Object} props.agreementFilterOptions - The filter options from API.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const AgreementsFilterButton = ({ filters, setFilters, agreementFilterOptions }) => {
    const {
        fiscalYear,
        setFiscalYear,
        portfolio,
        setPortfolio,
        projectTitle,
        setProjectTitle,
        agreementType,
        setAgreementType,
        agreementName,
        setAgreementName,
        contractNumber,
        setContractNumber,
        applyFilter,
        resetFilter
    } = useAgreementsFilterButton(filters, setFilters);

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = `usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`;

    const fieldsetList = [
        <fieldset
            key="field1"
            className={`margin-top-105 ${fieldStyles}`}
        >
            <FiscalYearComboBox
                selectedFiscalYears={fiscalYear}
                setSelectedFiscalYears={setFiscalYear}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={{ width: "22.7rem" }}
                budgetLinesFiscalYears={agreementFilterOptions?.fiscal_years || []}
                label="Compare Fiscal Years"
                includeAllOption={true}
            />
        </fieldset>,
        <fieldset
            key="field2"
            className="usa-fieldset"
        >
            <PortfoliosComboBox
                selectedPortfolios={portfolio}
                setSelectedPortfolios={setPortfolio}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field3"
            className={`margin-top-105 ${fieldStyles}`}
        >
            <ProjectTitleComboBox
                selectedProjects={projectTitle}
                setSelectedProjects={setProjectTitle}
                agreementFilterOptions={agreementFilterOptions}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field4"
            className={`margin-top-105 ${fieldStyles}`}
        >
            <AgreementTypeComboBox
                selectedAgreementTypes={agreementType}
                setSelectedAgreementTypes={setAgreementType}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field5"
            className={`margin-top-105 ${fieldStyles}`}
        >
            <AgreementNameComboBox
                selectedAgreementNames={agreementName}
                setSelectedAgreementNames={setAgreementName}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field6"
            className={`margin-top-105 ${fieldStyles}`}
        >
            <ContractNumberComboBox
                selectedContractNumbers={contractNumber}
                setSelectedContractNumbers={setContractNumber}
                agreementFilterOptions={agreementFilterOptions}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={{ width: "22.7rem" }}
            />
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
