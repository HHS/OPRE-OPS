import Modal from "react-modal";
import customStyles from "./AgreementsFilterButton.module.css";
import BLIStatusComboBox from "../../../../components/BudgetLineItems/BLIStatusComboBox";
import FiscalYearComboBox from "../../../../components/UI/Form/FiscalYearComboBox";
import PortfoliosComboBox from "../../../../components/Portfolios/PortfoliosComboBox";
import FilterButton from "../../../../components/UI/FilterButton/FilterButton";
import useAgreementsFilterButton from "./AgreementsFilterButton.hooks";
import constants from "../../../../constants";
/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const AgreementsFilterButton = ({ filters, setFilters }) => {
    const {
        fiscalYear,
        setFiscalYear,
        portfolio,
        setPortfolio,
        budgetLineStatus,
        setBudgetLineStatus,
        applyFilter,
        resetFilter
    } = useAgreementsFilterButton(filters, setFilters);



    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = `usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`;

    const fieldsetList = [
        <fieldset
            key="field1"
            className={fieldStyles}
        >
            <FiscalYearComboBox
                selectedFiscalYears={fiscalYear}
                setSelectedFiscalYears={setFiscalYear}
                legendClassname={legendStyles}
                defaultString={"All Fiscal Years"}
                overrideStyles={{ width: "22.7rem" }}
                budgetLinesFiscalYears={constants.fiscalYears}
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
                defaultString={"All Portfolios"}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field3"
            className={`margin-top-105 ${fieldStyles}`}
            style={{ width: "22.7rem" }}
        >
            <BLIStatusComboBox
                selectedBLIStatus={budgetLineStatus}
                setSelectedBLIStatus={setBudgetLineStatus}
                legendClassname={legendStyles}
                defaultString={"All Budget Line Statuses"}
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
