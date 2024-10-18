import React from "react";
import DoubleRangeSlider from "../../UI/DoubleRangeSlider";
import CurrencyFormat from "react-currency-format";
/**
 * @typedef {Object} CANFYBudgetRangeSliderProps
 * @property {[number, number]} fyBudgetRange - The min and max of the fiscal year budget range
 * @property {string} [legendClassname] - CSS class for the legend
 * @property {[number, number]} budget - The current budget range
 * @property {function([number, number]): void} setBudget - Function to update the budget
 */

/**
 * @description CANFYBudgetRangeSlider component
 * @component
 * @param {CANFYBudgetRangeSliderProps} props
 * @returns {JSX.Element} - The CAN FY Budget Range Slider component
 */
const CANFYBudgetRangeSlider = ({ fyBudgetRange, legendClassname = "usa-label margin-top-0", budget, setBudget }) => {
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
        const selectedMinFYBudget = calculateValue(minPercentage, fyBudgetMin, fyBudgetMax);
        const selectedMaxFYBudget = calculateValue(maxPercentage, fyBudgetMin, fyBudgetMax);

        setBudget([selectedMinFYBudget, selectedMaxFYBudget]);
        setSliderValue(newRange);
    };

    React.useEffect(() => {
        const minPercentage = calculatePercentage(minValue, fyBudgetMin, fyBudgetMax);
        const maxPercentage = calculatePercentage(maxValue, fyBudgetMin, fyBudgetMax);

        setSliderValue([minPercentage, maxPercentage]);
    }, [budget, fyBudgetRange]);

    return (
        <>
            <div className="display-flex flex-justify">
                <label
                    className={legendClassname}
                    htmlFor="can-FY-budgey-combobox-input"
                >
                    FY Budget
                </label>
            </div>
            <div className="padding-right-10">
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
                    <span> - </span>
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

export default CANFYBudgetRangeSlider;
