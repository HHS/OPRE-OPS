import React from "react";
import Modal from "react-modal";
import customStyles from "./PortfolioFilterButton.module.css";
import FilterButton from "../../../../components/UI/FilterButton/FilterButton";
import PortfoliosComboBox from "../../../../components/Portfolios/PortfoliosComboBox";
import PortfolioFYBudgetRangeSlider from "./PortfolioFYBudgetRangeSlider";
import AvailableBudgetPercentageFilter from "./AvailableBudgetPercentageFilter";
import { DEFAULT_PORTFOLIO_BUDGET_RANGE } from "../../../../constants";

/**
 * A filter for portfolios.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {Array} props.allPortfolios - All available portfolios for the dropdown.
 * @param {Array} props.fyBudgetRange - The fiscal year budget range [min, max] for the slider.
 * @returns {JSX.Element} - The portfolio filter button element.
 */
export const PortfolioFilterButton = ({ filters, setFilters, allPortfolios, fyBudgetRange }) => {
    const [portfolios, setPortfolios] = React.useState([]);
    const [budgetRange, setBudgetRange] = React.useState(DEFAULT_PORTFOLIO_BUDGET_RANGE);
    const [availablePct, setAvailablePct] = React.useState([]);

    // Sync component state with filters prop (used when filter tags are removed)
    React.useEffect(() => {
        setPortfolios(filters.portfolios || []);
    }, [filters.portfolios]);

    React.useEffect(() => {
        // If filters.budgetRange is at DEFAULT, show fyBudgetRange instead
        // Otherwise sync from filters.budgetRange (user has applied a filter)
        if (filters.budgetRange && filters.budgetRange.length === 2) {
            const [min, max] = filters.budgetRange;
            const isDefaultRange =
                min === DEFAULT_PORTFOLIO_BUDGET_RANGE[0] && max === DEFAULT_PORTFOLIO_BUDGET_RANGE[1];

            if (isDefaultRange && fyBudgetRange && fyBudgetRange.length === 2) {
                // Show fiscal year range when no filter applied
                setBudgetRange(fyBudgetRange);
            } else {
                // Show the filtered range when user has applied a filter
                setBudgetRange(filters.budgetRange);
            }
        }
    }, [filters.budgetRange, fyBudgetRange]);

    React.useEffect(() => {
        setAvailablePct(filters.availablePct || []);
    }, [filters.availablePct]);

    const applyFilter = () => {
        // Only update budgetRange if user manually adjusted it from fyBudgetRange
        const budgetRangeMatchesFy =
            fyBudgetRange &&
            fyBudgetRange.length === 2 &&
            budgetRange.length === 2 &&
            budgetRange[0] === fyBudgetRange[0] &&
            budgetRange[1] === fyBudgetRange[1];

        setFilters((prevState) => {
            return {
                ...prevState,
                portfolios: portfolios,
                // If budgetRange matches fyBudgetRange, keep DEFAULT (no filter applied)
                budgetRange: budgetRangeMatchesFy ? DEFAULT_PORTFOLIO_BUDGET_RANGE : budgetRange,
                availablePct: availablePct
            };
        });
    };

    const resetFilter = () => {
        setFilters({
            portfolios: [],
            budgetRange: DEFAULT_PORTFOLIO_BUDGET_RANGE,
            availablePct: []
        });
        setPortfolios([]);
        setBudgetRange(fyBudgetRange); // Display FY range in slider
        setAvailablePct([]);
    };

    const fieldStyles = "usa-fieldset margin-bottom-205";
    const legendStyles = `usa-legend font-sans-3xs margin-top-0 padding-bottom-1 ${customStyles.legendColor}`;

    const fieldsetList = [
        <fieldset
            key="field1"
            className={fieldStyles}
        >
            <PortfoliosComboBox
                portfolioOptions={allPortfolios || []}
                selectedPortfolios={portfolios}
                setSelectedPortfolios={setPortfolios}
                legendClassname={legendStyles}
                overrideStyles={{ width: "22.7rem" }}
            />
        </fieldset>,
        <fieldset
            key="field2"
            className={fieldStyles}
        >
            <PortfolioFYBudgetRangeSlider
                fyBudgetRange={fyBudgetRange}
                legendClassname={legendStyles}
                budget={budgetRange}
                setBudget={setBudgetRange}
            />
        </fieldset>,
        <fieldset
            key="field3"
            className={fieldStyles}
        >
            <AvailableBudgetPercentageFilter
                selectedRanges={availablePct}
                setSelectedRanges={setAvailablePct}
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

export default PortfolioFilterButton;
