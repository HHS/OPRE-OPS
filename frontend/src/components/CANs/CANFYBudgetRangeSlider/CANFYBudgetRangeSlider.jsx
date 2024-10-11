import {useState} from "react";
import DoubleRangeSlider from "../../UI/DoubleRangeSlider/DoubleRangeSlider.jsx";

const CANFYBudgetRangeSlider = ({
    fyBudgetRange,
    legendClassname = "usa-label margin-top-0",
    // overrideStyles = {}
}) => {
    console.log(fyBudgetRange);
    const [range, setRange] = useState([fyBudgetRange[0], fyBudgetRange[1]]);

    const handleValueChange = (newRange) => {
        console.log('Old range:', range);
        console.log('New range:', newRange);
        let selectedMinFYBudget = (newRange[0]/100)*fyBudgetRange[1];
        const selectedMaxFYBudget = (newRange[1]/100)*fyBudgetRange[1];
        if (selectedMinFYBudget === 0) {
            selectedMinFYBudget = fyBudgetRange[0];
        } else {
            // Todo: Determine the difference between the smallest FY budget value and where the left thumb is
            const difference = 0
            selectedMinFYBudget = fyBudgetRange[0] + difference
        }

        console.log({selectedMinFYBudget, selectedMaxFYBudget});
        setRange([selectedMinFYBudget, selectedMaxFYBudget]);
    };

    return (
        <div >
            <div className="display-flex flex-justify">
                <label
                    className={legendClassname}
                    htmlFor="can-FY-budgey-combobox-input"
                >
                    FY Budget
                </label>
            </div>
            <div>
                <DoubleRangeSlider
                    // min={range[0]}
                    // max={range[1]}
                    onValueChange={handleValueChange}/>
            </div>
        </div>
    )
};

export default CANFYBudgetRangeSlider;
