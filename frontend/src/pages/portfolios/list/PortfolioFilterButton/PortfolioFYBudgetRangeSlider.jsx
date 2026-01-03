import React from "react";
import DoubleRangeSlider from "../../../../components/UI/DoubleRangeSlider";
import CurrencyFormat from "react-currency-format";

/**
 * @typedef {Object} PortfolioFYBudgetRangeSliderProps
 * @property {[number, number]} fyBudgetRange - The min and max of the fiscal year budget range
 * @property {string} [legendClassname] - CSS class for the legend
 * @property {[number, number]} budget - The current budget range
 * @property {function([number, number]): void} setBudget - Function to update the budget
 */

/**
 * @description PortfolioFYBudgetRangeSlider component
 * @component
 * @param {PortfolioFYBudgetRangeSliderProps} props
 * @returns {JSX.Element} - The Portfolio FY Budget Range Slider component
 */
const PortfolioFYBudgetRangeSlider = ({
    fyBudgetRange,
    legendClassname = "usa-label margin-top-0",
    budget,
    setBudget
}) => {
    const [minValue, maxValue] = budget;
    const [fyBudgetMin, fyBudgetMax] = fyBudgetRange;
    const [sliderValue, setSliderValue] = React.useState([0, 100]);

    /**
     * Calculate percentage of a value within a range
     * @param {number} value - The value to calculate percentage for
     * @param {number} min - The minimum value of the range
     * @param {number} max - The maximum value of the range
     * @returns {number} The calculated percentage
     */
    const calculatePercentage = (value, min, max) => {
        // Prevent division by zero when min === max
        if (min === max) {
            return 0;
        }
        return ((value - min) / (max - min)) * 100;
    };

    /**
     * Calculate value based on percentage within a range
     * @param {number} percentage - The percentage to calculate value for
     * @param {number} min - The minimum value of the range
     * @param {number} max - The maximum value of the range
     * @returns {number} The calculated value
     */
    const calculateValue = (percentage, min, max) => {
        // Prevent issues when min === max
        if (min === max) {
            return min;
        }
        return Math.round(min + (percentage / 100) * (max - min));
    };

    /**
     * Calculate the new budget range based on slider values
     * @param {[number, number]} newRange - The new range from the slider
     */
    const calculateBudgetRange = (newRange) => {
        const [minPercentage, maxPercentage] = newRange;
        const selectedMinFYBudget = calculateValue(minPercentage, fyBudgetMin, fyBudgetMax);
        const selectedMaxFYBudget = calculateValue(maxPercentage, fyBudgetMin, fyBudgetMax);

        setBudget([selectedMinFYBudget, selectedMaxFYBudget]);
        setSliderValue(newRange);
    };

    React.useEffect(() => {
        const minPercentage = calculatePercentage(minValue, fyBudgetMin, fyBudgetMax);
        const maxPercentage = calculatePercentage(maxValue, fyBudgetMin, fyBudgetMax);

        setSliderValue([minPercentage, maxPercentage]);
    }, [budget, fyBudgetRange, fyBudgetMax, fyBudgetMin, maxValue, minValue]);

    return (
        <>
            <div className="display-flex flex-justify">
                <label
                    className={legendClassname}
                    htmlFor="portfolio-FY-budget-combobox-input"
                >
                    FY Budget
                </label>
            </div>
            <div
                className="padding-right-10"
                data-testid="portfolio-fy-budget-range-slider"
            >
                <DoubleRangeSlider
                    handleChange={calculateBudgetRange}
                    defaultValue={[0, 100]}
                    value={sliderValue}
                />
            </div>

            <div className="margin-top-1 display-flex flex-justify-center font-12px padding-right-10">
                <span>
                    <CurrencyFormat
                        value={minValue}
                        decimalScale={0}
                        thousandSeparator={true}
                        displayType="text"
                        prefix={"$ "}
                    />
                    <span> to </span>
                    <CurrencyFormat
                        value={maxValue}
                        decimalScale={0}
                        thousandSeparator={true}
                        displayType="text"
                        prefix={"$ "}
                    />
                </span>
            </div>
        </>
    );
};

export default PortfolioFYBudgetRangeSlider;
