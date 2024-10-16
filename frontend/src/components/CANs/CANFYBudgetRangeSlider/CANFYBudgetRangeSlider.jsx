import React from "react";
import DoubleRangeSlider from "../../UI/DoubleRangeSlider";
import CurrencyFormat from "react-currency-format";

const CANFYBudgetRangeSlider = ({ fyBudgetRange, legendClassname = "usa-label margin-top-0", budget, setBudget }) => {
    React.useEffect(() => {
        setBudget([fyBudgetRange[0], fyBudgetRange[1]]);
    }, [fyBudgetRange]);

    const [minValue, maxValue] = budget;

    const calculateBudgetRange = (newRange) => {
        const [minPercentage, maxPercentage] = newRange;
        const fyBudgetMin = fyBudgetRange[0];
        const fyBudgetMax = fyBudgetRange[1];
        const fyBudgetDiff = fyBudgetMax - fyBudgetMin;

        const selectedMinFYBudget = Math.round(fyBudgetMin + (minPercentage / 100) * fyBudgetDiff);
        const selectedMaxFYBudget = Math.round(fyBudgetMin + (maxPercentage / 100) * fyBudgetDiff);

        setBudget([selectedMinFYBudget, selectedMaxFYBudget]);
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
