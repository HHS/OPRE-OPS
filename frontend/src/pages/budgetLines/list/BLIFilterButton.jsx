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
import { getCurrentFiscalYear } from "../../../helpers/utils";
import { FILTER_MODAL_FULL_WIDTH } from "../../../constants";

/**
 * A filter for budget line items.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {string|number} props.selectedFiscalYear - The current fiscal year value from the page-level dropdown. Can be a number (specific year), "All" (user-selected), "Multi" (auto-set when multiple years filtered), or undefined. Used to update the modal's placeholder text only - does not pre-select filter values.
 * @returns {React.ReactElement} - The filter button component.
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
    const allFiscalYearsOption = React.useMemo(() => ({ id: "ALL", title: "All FYs" }), []);

    const myBudgetLineItemsUrl = searchParams.get("filter") === "my-budget-lines";

    /** @type {{data?: import("../../../types/BudgetLineTypes").Filters | undefined, isSuccess: boolean}} */
    const { data: filterOptions } = useGetBudgetLineItemsFilterOptionsQuery(
        { onlyMy: myBudgetLineItemsUrl, enableObe: false },
        { refetchOnMountOrArgChange: true }
    );

    // Ensure current fiscal year and selected filter years are included in the fiscal year options
    const fiscalYearOptions = React.useMemo(() => {
        let options = (filterOptions?.fiscal_years ?? [])
            .map((year) => Number(year))
            .filter((year) => !Number.isNaN(year));
        const selectedFilterYears = Array.isArray(filters.fiscalYears)
            ? filters.fiscalYears
                  .map((fiscalYear) => (typeof fiscalYear?.id === "number" ? fiscalYear.id : Number(fiscalYear?.id)))
                  .filter((year) => !Number.isNaN(year))
            : [];

        const currentFiscalYear = getCurrentFiscalYear();
        options = Array.from(new Set([...options, currentFiscalYear, ...selectedFilterYears]));

        if (selectedFiscalYear && selectedFiscalYear !== "Multi" && selectedFiscalYear !== "All") {
            const yearAsNumber = Number(selectedFiscalYear);
            if (!isNaN(yearAsNumber) && !options.includes(yearAsNumber)) {
                return [allFiscalYearsOption, ...[...options, yearAsNumber].sort((a, b) => b - a)];
            }
        }
        return [allFiscalYearsOption, ...options];
    }, [filterOptions?.fiscal_years, filters.fiscalYears, selectedFiscalYear, allFiscalYearsOption]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    // filters.fiscalYears = null means "All FYs" was selected in the modal (should show in modal)
    // filters.fiscalYears = [] means page dropdown was changed (should NOT show in modal)
    React.useEffect(() => {
        if (isResetting.current) {
            // Don't pre-populate if user just reset the filters
            setFiscalYears(filters.fiscalYears ?? []);
            isResetting.current = false;
        } else if (filters.fiscalYears === null) {
            // "All FYs" was selected in the modal, show it as selected when reopening
            setFiscalYears([allFiscalYearsOption]);
        } else {
            // Either specific years selected or empty array (page dropdown change)
            setFiscalYears(filters.fiscalYears ?? []);
        }
    }, [filters.fiscalYears, selectedFiscalYear, allFiscalYearsOption]);

    const handleFiscalYearsChange = (nextFiscalYears) => {
        if (!Array.isArray(nextFiscalYears)) {
            setFiscalYears([]);
            return;
        }
        const hasAllFiscalYears = nextFiscalYears.some((fiscalYear) => fiscalYear?.id === "ALL");
        if (hasAllFiscalYears) {
            if ((fiscalYears ?? []).some((fiscalYear) => fiscalYear?.id === "ALL")) {
                const selectedYears = nextFiscalYears.filter((fiscalYear) => fiscalYear?.id !== "ALL");
                setFiscalYears(selectedYears);
                return;
            }
            setFiscalYears([allFiscalYearsOption]);
            return;
        }
        setFiscalYears(nextFiscalYears.filter((fiscalYear) => fiscalYear?.id !== "ALL"));
    };

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
        const normalizedFiscalYears = Array.isArray(fiscalYears) ? fiscalYears : [];
        const hasAllFiscalYears = normalizedFiscalYears.some((fiscalYear) => fiscalYear.id === "ALL");
        let nextFiscalYears = normalizedFiscalYears;
        if (hasAllFiscalYears) {
            nextFiscalYears = null;
        } else if (normalizedFiscalYears.length === 0) {
            // Keep as empty array to preserve page dropdown state
            nextFiscalYears = [];
        }
        setFilters((prevState) => {
            return {
                ...prevState,
                fiscalYears: nextFiscalYears,
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

    // Calculate default string based on selectedFiscalYear from the shortcut dropdown
    const getDefaultFiscalYearString = () => {
        if (!selectedFiscalYear || selectedFiscalYear === "Multi") {
            return `Fiscal Year ${getCurrentFiscalYear()}`;
        }
        if (selectedFiscalYear === "All") {
            return "All Fiscal Years";
        }
        // It's a specific year number
        return `Fiscal Year ${selectedFiscalYear}`;
    };

    const fieldsetList = [
        <fieldset
            key="field1"
            className={fieldStyles}
        >
            <FiscalYearComboBox
                selectedFiscalYears={fiscalYears}
                setSelectedFiscalYears={handleFiscalYearsChange}
                legendClassname={legendStyles}
                defaultString={getDefaultFiscalYearString()}
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
                budgetLinesFiscalYears={fiscalYearOptions}
                label="Compare Fiscal Years"
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
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
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
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
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
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
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
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
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
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
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
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
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
