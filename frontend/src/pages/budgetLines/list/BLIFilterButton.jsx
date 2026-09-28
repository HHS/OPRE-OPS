import React from "react";
import customStyles from "./BLIFilterButton.module.css";
import FilterButton from "../../../components/UI/FilterButton/FilterButton";
import FiscalYearComboBox from "../../../components/UI/Form/FiscalYearComboBox";
import PortfoliosComboBox from "../../../components/Portfolios/PortfoliosComboBox";
import BudgetRangeSlider from "../../../components/UI/BudgetRangeSlider";
import AgreementTypeComboBox from "../../../components/Agreements/AgreementTypeComboBox/AgreementTypeComboBox";
import AgreementNameComboBox from "../../../components/Agreements/AgreementNameComboBox/AgreementNameComboBox";
import CANActivePeriodComboBox from "../../../components/CANs/CANActivePeriodComboBox/CANActivePeriodComboBox";
import BLIStatusComboBox from "../../../components/BudgetLineItems/BLIStatusComboBox";
import { FILTER_MODAL_FULL_WIDTH } from "../../../constants";

/**
 * @param {Object} props
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {boolean} props.showModal - Controlled modal visibility (for reseed-on-open).
 * @param {Function} props.setShowModal - Controlled modal setter.
 * @param {import("../../../types/BudgetLineTypes").Filters} [props.filterOptions] - Prefetched filter options.
 * @param {React.MutableRefObject<boolean>} [props.applyFiredFYRef] - Ref set to true immediately
 *   before applyFilter writes to parent state. Lets the page-level FY reset effect distinguish
 *   tag removal (should revert to "All") from Apply (should preserve the dropdown's current year).
 * @returns {React.ReactElement}
 */
export const BLIFilterButton = ({ filters, setFilters, showModal, setShowModal, filterOptions, applyFiredFYRef }) => {
    const [fiscalYears, setFiscalYears] = React.useState([]);
    const [portfolios, setPortfolios] = React.useState([]);
    const [bliStatus, setBLIStatus] = React.useState([]);
    const [budgetRange, setBudgetRange] = React.useState(null);
    const [budgetRangeOptions, setBudgetRangeOptions] = React.useState([]);
    const [agreementTypes, setAgreementTypes] = React.useState([]);
    const [agreementTitles, setAgreementTitles] = React.useState([]);
    const [canActivePeriods, setCanActivePeriods] = React.useState([]);

    // Fiscal year options for the combobox — sourced from API filter options only.
    const fiscalYearOptions = React.useMemo(() => {
        const options = (filterOptions?.fiscal_years ?? [])
            .map((year) => Number(year))
            .filter((year) => !Number.isNaN(year));
        const selectedFilterYears = Array.isArray(filters.fiscalYears)
            ? filters.fiscalYears
                  .map((fy) => (typeof fy?.id === "number" ? fy.id : Number(fy?.id)))
                  .filter((year) => !Number.isNaN(year))
            : [];
        return Array.from(new Set([...options, ...selectedFilterYears])).sort((a, b) => b - a);
    }, [filterOptions?.fiscal_years, filters.fiscalYears]);

    // Reseed all local buffers from parent filters when the modal opens.
    // This ensures Reset-without-Apply followed by re-opening shows active filters, not cleared state.
    React.useEffect(() => {
        if (showModal) {
            setFiscalYears(filters.fiscalYears ?? []);
            setPortfolios(filters.portfolios ?? []);
            setBLIStatus(filters.bliStatus ?? []);
            setBudgetRange(filters.budgetRange);
            setAgreementTypes(filters.agreementTypes ?? []);
            setAgreementTitles(filters.agreementTitles ?? []);
            setCanActivePeriods(filters.canActivePeriods ?? []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal]);

    // Individual sync effects keep the modal in sync when tags are removed externally.
    React.useEffect(() => {
        setFiscalYears(filters.fiscalYears ?? []);
    }, [filters.fiscalYears]);

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

    // Calculate budget range options from filterOptions
    React.useEffect(() => {
        if (filterOptions?.budget_line_total_range) {
            const min = filterOptions.budget_line_total_range.min ?? 0;
            const max = filterOptions.budget_line_total_range.max ?? 1000000;
            setBudgetRangeOptions([min, max]);
        }
    }, [filterOptions]);

    const applyFilter = () => {
        // Signal to the page-level FY reset effect that this emptying came from Apply,
        // not from tag removal — so it should NOT revert selectedFiscalYear to "All".
        // Only set the ref when this Apply will actually change filters.fiscalYears'
        // reference — otherwise the consuming effect never re-runs to clear it, and
        // the stale "true" wrongly suppresses a later, unrelated tag-removal reset.
        if (applyFiredFYRef && fiscalYears !== filters.fiscalYears) applyFiredFYRef.current = true;
        setFilters((prevState) => ({
            ...prevState,
            fiscalYears: Array.isArray(fiscalYears) ? fiscalYears : [],
            portfolios,
            bliStatus,
            budgetRange,
            agreementTypes,
            agreementTitles,
            canActivePeriods
        }));
    };

    const resetFilter = () => {
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
                defaultString=""
                overrideStyles={FILTER_MODAL_FULL_WIDTH}
                budgetLinesFiscalYears={fiscalYearOptions}
                label="Compare Fiscal Years"
                includeAllOption={true}
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
                usePrefetchedOptions={true}
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

export default BLIFilterButton;
