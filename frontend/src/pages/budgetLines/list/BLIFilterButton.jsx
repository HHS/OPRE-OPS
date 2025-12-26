import React from "react";
import Modal from "react-modal";
import customStyles from "./BLIFilterButton.module.css";
import FilterButton from "../../../components/UI/FilterButton/FilterButton";
import FiscalYearComboBox from "../../../components/UI/Form/FiscalYearComboBox";
import PortfoliosComboBox from "../../../components/Portfolios/PortfoliosComboBox";
import BLIStatusComboBox from "../../../components/BudgetLineItems/BLIStatusComboBox";
import BudgetRangeSlider from "../../../components/UI/BudgetRangeSlider";
import { useSearchParams } from "react-router-dom";
import { useGetBudgetLineItemsFilterOptionsQuery } from "../../../api/opsAPI";

/**
 * A filter for agreements.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const BLIFilterButton = ({ filters, setFilters }) => {
    const [fiscalYears, setFiscalYears] = React.useState([]);
    const [portfolios, setPortfolios] = React.useState([]);
    const [bliStatus, setBLIStatus] = React.useState([]);
    const [budgetRange, setBudgetRange] = React.useState([0, 1000000]);
    const [budgetRangeOptions, setBudgetRangeOptions] = React.useState([0, 1000000]);
    const [searchParams] = useSearchParams();

    const myBudgetLineItemsUrl = searchParams.get("filter") === "my-budget-lines";

    /** @type {{data?: import("../../../types/BudgetLineTypes").Filters | undefined, isSuccess: boolean}} */
    const { data: filterOptions } = useGetBudgetLineItemsFilterOptionsQuery(
        { onlyMy: myBudgetLineItemsUrl, enableObe: false },
        { refetchOnMountOrArgChange: true }
    );

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    React.useEffect(() => {
        setFiscalYears(filters.fiscalYears);
    }, [filters.fiscalYears]);

    React.useEffect(() => {
        setPortfolios(filters.portfolios);
    }, [filters.portfolios]);

    React.useEffect(() => {
        setBLIStatus(filters.bliStatus);
    }, [filters.bliStatus]);

    React.useEffect(() => {
        if (filters.budgetRange) {
            setBudgetRange(filters.budgetRange);
        }
    }, [filters.budgetRange]);

    // Calculate budget range from filterOptions
    React.useEffect(() => {
        if (filterOptions?.budget_line_total_range) {
            const min = filterOptions.budget_line_total_range.min ?? 0;
            const max = filterOptions.budget_line_total_range.max ?? 1000000;
            setBudgetRangeOptions([min, max]);
            // Initialize budgetRange if not set
            if (!filters.budgetRange) {
                setBudgetRange([min, max]);
            }
        }
    }, [filterOptions, filters.budgetRange]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                fiscalYears: fiscalYears,
                portfolios: portfolios,
                bliStatus: bliStatus,
                budgetRange: budgetRange
            };
        });
    };

    const resetFilter = () => {
        setFilters({
            fiscalYears: [],
            portfolios: [],
            bliStatus: [],
            budgetRange: null
        });
        setFiscalYears([]);
        setPortfolios([]);
        setBLIStatus([]);
        setBudgetRange(budgetRangeOptions);
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
                defaultString={"All Fiscal Years"}
                overrideStyles={{ width: "22.7rem" }}
                budgetLinesFiscalYears={filterOptions?.fiscal_years ?? []}
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
                defaultString={"All Portfolios"}
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
                defaultString={"All Budget Line Statuses"}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field4"
            className={fieldStyles}
        >
            <BudgetRangeSlider
                budgetRange={budgetRangeOptions}
                selectedRange={budgetRange}
                setSelectedRange={setBudgetRange}
                label="Budget Line Total"
                legendClassname={legendStyles}
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
