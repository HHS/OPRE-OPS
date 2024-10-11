import {useState} from "react";
import DoubleRangeSlider from "../../UI/DoubleRangeSlider/DoubleRangeSlider.jsx";

const CANFYBudgetComboBox = ({
    maxFYBudget,
    legendClassname = "usa-label margin-top-0",
    // overrideStyles = {}
}) => {
    const [range, setRange] = useState([maxFYBudget*0.25, maxFYBudget*0.75]);

    const handleValueChange = (newRange) => {
        setRange(newRange);
        console.log('New range:', newRange);
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
                    min={range[0]}
                    max={range[1]}
                    onValueChange={handleValueChange}/>
            </div>
        </div>
    )
};

export default CANFYBudgetComboBox;
