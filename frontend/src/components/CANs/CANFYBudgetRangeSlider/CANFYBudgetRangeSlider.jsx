import { useState } from "react";
import DoubleRangeSlider from "../../UI/DoubleRangeSlider";

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
            <div>
                <DoubleRangeSlider handleChange={handleChange} />
                <span>{`range: ${range}`}</span>
            </div>
        </>
    );
};

export default CANFYBudgetRangeSlider;
