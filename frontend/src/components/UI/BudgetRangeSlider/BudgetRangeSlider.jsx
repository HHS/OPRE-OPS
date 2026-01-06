import React from "react";
import DoubleRangeSlider from "../DoubleRangeSlider";
import CurrencyFormat from "react-currency-format";

/**
 * @typedef {Object} BudgetRangeSliderProps
 * @property {[number, number]} budgetRange - The min and max of the budget range
 * @property {string} [legendClassname] - CSS class for the legend
 * @property {[number, number]} selectedRange - The current selected range
 * @property {function([number, number]): void} setSelectedRange - Function to update the range
 * @property {string} [label] - Label for the slider (default: "Budget Range")
 */

/**
 * @description BudgetRangeSlider component - A reusable slider for selecting budget ranges
 * @component
 * @param {BudgetRangeSliderProps} props
 * @returns {React.ReactElement} - The Budget Range Slider component
 */
const BudgetRangeSlider = ({
    budgetRange,
    selectedRange,
    setSelectedRange,
    label = "Budget Range",
    legendClassname = "usa-label margin-top-0"
}) => {
    const [minValue, maxValue] = selectedRange;
    const [budgetMin, budgetMax] = budgetRange;
    const [sliderValue, setSliderValue] = React.useState([0, 100]);

    /**
     * Calculate percentage of a value within a range
     * @param {number} value - The value to calculate percentage for
     * @param {number} min - The minimum value of the range
     * @param {number} max - The maximum value of the range
     * @returns {number} The calculated percentage
     */
    const calculatePercentage = (value, min, max) => {
        if (max === min) return 0;
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
        return Math.round(min + (percentage / 100) * (max - min));
    };

    /**
     * Calculate the new budget range based on slider values
     * @param {[number, number]} newRange - The new range from the slider
     */
    const calculateBudgetRange = (newRange) => {
        const [minPercentage, maxPercentage] = newRange;
        const selectedMin = calculateValue(minPercentage, budgetMin, budgetMax);
        const selectedMax = calculateValue(maxPercentage, budgetMin, budgetMax);

        setSelectedRange([selectedMin, selectedMax]);
        setSliderValue(newRange);
    };

    React.useEffect(() => {
        const minPercentage = calculatePercentage(minValue, budgetMin, budgetMax);
        const maxPercentage = calculatePercentage(maxValue, budgetMin, budgetMax);

        setSliderValue([minPercentage, maxPercentage]);
    }, [selectedRange, budgetRange, budgetMax, budgetMin, maxValue, minValue]);

    return (
        <>
            <div className="display-flex flex-justify">
                <label
                    className={legendClassname}
                    htmlFor="budget-range-slider"
                >
                    {label}
                </label>
            </div>
            <div
                className="padding-right-10"
                data-testid="budget-range-slider"
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
                        decimalScale={2}
                        thousandSeparator={true}
                        displayType="text"
                        prefix={"$ "}
                    />
                    <span> to </span>
                    <CurrencyFormat
                        value={maxValue}
                        decimalScale={2}
                        thousandSeparator={true}
                        displayType="text"
                        prefix={"$ "}
                    />
                </span>
            </div>
        </>
    );
};

export default BudgetRangeSlider;
