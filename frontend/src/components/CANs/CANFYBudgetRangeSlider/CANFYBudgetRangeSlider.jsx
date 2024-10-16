import { useState } from "react";
import DoubleRangeSlider from "../../UI/DoubleRangeSlider";
import CurrencyFormat from "react-currency-format";

const CANFYBudgetRangeSlider = ({ fyBudgetRange, legendClassname = "usa-label margin-top-0" }) => {
    const [range, setRange] = useState([fyBudgetRange[0], fyBudgetRange[1]]);

    const handleChange = (newRange) => {
        const [minPercentage, maxPercentage] = newRange;
        const fyBudgetMin = fyBudgetRange[0];
        const fyBudgetMax = fyBudgetRange[1];
        const fyBudgetDiff = fyBudgetMax - fyBudgetMin;

        const selectedMinFYBudget = Math.round(fyBudgetMin + (minPercentage / 100) * fyBudgetDiff);
        const selectedMaxFYBudget = Math.round(fyBudgetMin + (maxPercentage / 100) * fyBudgetDiff);

        setRange([selectedMinFYBudget, selectedMaxFYBudget]);
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
            <DoubleRangeSlider
                handleChange={handleChange}
                defaultValue={[0, 100]}
            />
            <div className="margin-top-1 display-flex flex-justify-center">
                <span>
                    <CurrencyFormat
                        value={range[0]}
                        decimalScale={2}
                        thousandSeparator={true}
                        displayType="text"
                        prefix={"$ "}
                    />
                    <span> - </span>
                    <CurrencyFormat
                        value={range[1]}
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
