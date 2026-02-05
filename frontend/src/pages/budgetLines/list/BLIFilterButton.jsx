import React from "react";
import Modal from "react-modal";
import customStyles from "./BLIFilterButton.module.css";
import FilterButton from "../../../components/UI/FilterButton/FilterButton";
import FiscalYearComboBox from "../../../components/UI/Form/FiscalYearComboBox";
import PortfoliosComboBox from "../../../components/Portfolios/PortfoliosComboBox";
import BudgetRangeSlider from "../../../components/UI/BudgetRangeSlider";
import AgreementTypeComboBox from "../../../components/Agreements/AgreementTypeComboBox/AgreementTypeComboBox";
import AgreementNameComboBox from "../../../components/Agreements/AgreementNameComboBox/AgreementNameComboBox";
import CANActivePeriodComboBox from "../../../components/CANs/CANActivePeriodComboBox/CANActivePeriodComboBox";
import BLIStatusComboBox from "../../../components/BudgetLineItems/BLIStatusComboBox";
import { useSearchParams } from "react-router-dom";
import { useGetBudgetLineItemsFilterOptionsQuery } from "../../../api/opsAPI";

/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {string|number} props.selectedFiscalYear - The currently selected fiscal year from the dropdown.
 * @returns {React.ReactElement} - The procurement shop select element.
 */
export const BLIFilterButton = ({ filters, setFilters, selectedFiscalYear }) => {
    const [fiscalYears, setFiscalYears] = React.useState([]);
    const [portfolios, setPortfolios] = React.useState([]);
    const [bliStatus, setBLIStatus] = React.useState([]);
    const [budgetRange, setBudgetRange] = React.useState(null);
    const [budgetRangeOptions, setBudgetRangeOptions] = React.useState([]);
    const [agreementTypes, setAgreementTypes] = React.useState([]);
    const [agreementTitles, setAgreementTitles] = React.useState([]);
    const [canActivePeriods, setCanActivePeriods] = React.useState([]);
    const [searchParams] = useSearchParams();
    const isResetting = React.useRef(false);

    const myBudgetLineItemsUrl = searchParams.get("filter") === "my-budget-lines";

    /** @type {{data?: import("../../../types/BudgetLineTypes").Filters | undefined, isSuccess: boolean}} */
    const { data: filterOptions } = useGetBudgetLineItemsFilterOptionsQuery(
        { onlyMy: myBudgetLineItemsUrl, enableObe: false },
        { refetchOnMountOrArgChange: true }
    );

    // Ensure selectedFiscalYear is included in the fiscal year options
    const fiscalYearOptions = React.useMemo(() => {
        const options = filterOptions?.fiscal_years ?? [];
        if (selectedFiscalYear && selectedFiscalYear !== "Multi") {
            const yearAsNumber = Number(selectedFiscalYear);
            if (!isNaN(yearAsNumber) && !options.includes(yearAsNumber)) {
                return [...options, yearAsNumber].sort((a, b) => b - a);
            }
        }
        return options;
    }, [filterOptions?.fiscal_years, selectedFiscalYear]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    // Also pre-populates with the selected fiscal year when no filters are applied
    React.useEffect(() => {
        if (isResetting.current) {
            // Don't pre-populate if user just reset the filters
            setFiscalYears(filters.fiscalYears ?? []);
            isResetting.current = false;
        } else if ((filters.fiscalYears ?? []).length === 0 && selectedFiscalYear && selectedFiscalYear !== "Multi") {
            const yearAsNumber = Number(selectedFiscalYear);
            if (!isNaN(yearAsNumber)) {
                setFiscalYears([{ id: yearAsNumber, title: yearAsNumber }]);
            }
        } else {
            setFiscalYears(filters.fiscalYears ?? []);
        }
    }, [filters.fiscalYears, selectedFiscalYear]);

    React.useEffect(() => {
        setPortfolios(filters.portfolios ?? []);
    }, [filters.portfolios]);

    React.useEffect(() => {
        setBLIStatus(filters.bliStatus ?? []);
    }, [filters.bliStatus]);

    React.useEffect(() => {
        setBudgetRange(filters.budgetRange);
    }, [filters.budgetRange]);

    React.useEffect(() => {
        setAgreementTypes(filters.agreementTypes ?? []);
    }, [filters.agreementTypes]);

    React.useEffect(() => {
        setAgreementTitles(filters.agreementTitles ?? []);
    }, [filters.agreementTitles]);

    React.useEffect(() => {
        setCanActivePeriods(filters.canActivePeriods ?? []);
    }, [filters.canActivePeriods]);

    // Calculate budget range from filterOptions
    React.useEffect(() => {
        if (filterOptions?.budget_line_total_range) {
            const min = filterOptions.budget_line_total_range.min ?? 0;
            const max = filterOptions.budget_line_total_range.max ?? 1000000;
            setBudgetRangeOptions([min, max]);
        }
    }, [filterOptions]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                fiscalYears: fiscalYears,
                portfolios: portfolios,
                bliStatus: bliStatus,
                budgetRange: budgetRange,
                agreementTypes: agreementTypes,
                agreementTitles: agreementTitles,
                canActivePeriods: canActivePeriods
            };
        });
    };

    const resetFilter = () => {
        isResetting.current = true;
        setFilters({
            fiscalYears: [],
            portfolios: [],
            bliStatus: [],
            budgetRange: null,
            agreementTypes: [],
            agreementTitles: [],
            canActivePeriods: []
        });
        setFiscalYears([]);
        setPortfolios([]);
        setBLIStatus([]);
        setBudgetRange(null);
        setAgreementTypes([]);
        setAgreementTitles([]);
        setCanActivePeriods([]);
    };

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = `usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`;

    const fieldsetList = [
        <fieldset
            key="field1"
            className={fieldStyles}
        >
            <FiscalYearComboBox
                selectedFiscalYears={fiscalYears}
                setSelectedFiscalYears={setFiscalYears}
                legendClassname={legendStyles}
                overrideStyles={{ width: "22.7rem" }}
                budgetLinesFiscalYears={fiscalYearOptions}
            />
        </fieldset>,
        <fieldset
            key="field2"
            className={fieldStyles}
        >
            <PortfoliosComboBox
                portfolioOptions={filterOptions?.portfolios ?? []}
                selectedPortfolios={portfolios}
                setSelectedPortfolios={setPortfolios}
                legendClassname={legendStyles}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field3"
            className={fieldStyles}
        >
            <BLIStatusComboBox
                statusOptions={filterOptions?.statuses ?? []}
                selectedBLIStatus={bliStatus}
                setSelectedBLIStatus={setBLIStatus}
                legendClassname={legendStyles}
                defaultString={""}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field4"
            className={fieldStyles}
        >
            <BudgetRangeSlider
                budgetRange={budgetRangeOptions}
                selectedRange={budgetRange || budgetRangeOptions}
                setSelectedRange={setBudgetRange}
                label="Budget Line Total"
                legendClassname={legendStyles}
            />
        </fieldset>,
        <fieldset
            key="field5"
            className={fieldStyles}
        >
            <AgreementTypeComboBox
                selectedAgreementTypes={agreementTypes}
                setSelectedAgreementTypes={setAgreementTypes}
                legendClassname={legendStyles}
                overrideStyles={{ width: "22.7rem" }}
                agreementTypeOptions={filterOptions?.agreement_types ?? []}
            />
        </fieldset>,
        <fieldset
            key="field6"
            className={fieldStyles}
        >
            <AgreementNameComboBox
                selectedAgreementNames={agreementTitles}
                setSelectedAgreementNames={setAgreementTitles}
                legendClassname={legendStyles}
                overrideStyles={{ width: "22.7rem" }}
                agreementNameOptions={filterOptions?.agreement_names ?? null}
                filterLabel="Agreement Title"
            />
        </fieldset>,
        <fieldset
            key="field7"
            className={fieldStyles}
        >
            <CANActivePeriodComboBox
                activePeriod={canActivePeriods}
                setActivePeriod={setCanActivePeriods}
                legendClassname={legendStyles}
                overrideStyles={{ width: "22.7rem" }}
                canActivePeriodOptions={filterOptions?.can_active_periods ?? null}
                filterLabel="CAN Active Period"
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

export default BLIFilterButton;
