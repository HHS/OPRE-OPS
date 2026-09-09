import { useState } from "react";
import ComboBox from "../../UI/Form/ComboBox";
import { ALN_NUMBER_OPTIONS } from "./AlnNumbersComboBox.constants";

/**
 * A single-select combobox for adding ALN Numbers one at a time.
 * Selected numbers are displayed in a separate AlnNumberList below.
 * @param {Object} props - The component props.
 * @param {string[]} props.selectedAlnNumbers - The currently selected ALN Number ids.
 * @param {Function} props.addAlnNumber - Called with a single ALN id string when an option is selected.
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {string} [props.legendClassName] - Additional CSS classes to apply to the label/legend (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const AlnNumbersComboBox = ({
    selectedAlnNumbers,
    addAlnNumber,
    defaultString = "",
    legendClassName = "usa-label margin-top-0 margin-bottom-1",
    overrideStyles = {}
}) => {
    const [selectedOption, setSelectedOption] = useState({});

    const remainingOptions = ALN_NUMBER_OPTIONS.filter((opt) => !(selectedAlnNumbers ?? []).includes(opt.id));

    const handleChange = (option) => {
        if (option?.id) {
            addAlnNumber(option.id);
        }
        setSelectedOption({});
    };

    return (
        <div className="usa-form-group margin-top-0">
            <label
                className={legendClassName}
                htmlFor="aln-numbers-combobox-input"
            >
                ALN Numbers
            </label>
            <ComboBox
                namespace="aln-numbers-combobox"
                data={remainingOptions}
                selectedData={selectedOption}
                setSelectedData={handleChange}
                optionText={(opt) => opt.title}
                defaultString={defaultString}
                overrideStyles={overrideStyles}
                clearWhenSet={true}
            />
        </div>
    );
};

export default AlnNumbersComboBox;
