import React from "react";
import DoubleRangeSlider from "../../UI/DoubleRangeSlider";
import CurrencyFormat from "react-currency-format";

const CANFYBudgetRangeSlider = ({ fyBudgetRange, legendClassname = "usa-label margin-top-0", budget, setBudget }) => {
    const [minValue, maxValue] = budget;
    const [fyBudgetMin, fyBudgetMax] = fyBudgetRange;
    const [sliderValue, setSliderValue] = React.useState([0, 100]);

    const calculatePercentage = (value, min, max) => {
        return ((value - min) / (max - min)) * 100;
    };

    const calculateValue = (percentage, min, max) => {
        return Math.round(min + (percentage / 100) * (max - min));
    };

    React.useEffect(() => {
        const minPercentage = calculatePercentage(minValue, fyBudgetMin, fyBudgetMax);
        const maxPercentage = calculatePercentage(maxValue, fyBudgetMin, fyBudgetMax);

        setSliderValue([minPercentage, maxPercentage]);
    }, [budget, fyBudgetRange]);

    const calculateBudgetRange = (newRange) => {
        const [minPercentage, maxPercentage] = newRange;
        const selectedMinFYBudget = calculateValue(minPercentage, fyBudgetMin, fyBudgetMax);
        const selectedMaxFYBudget = calculateValue(maxPercentage, fyBudgetMin, fyBudgetMax);

        setBudget([selectedMinFYBudget, selectedMaxFYBudget]);
        setSliderValue(newRange);
    };

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
