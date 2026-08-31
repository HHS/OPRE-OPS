import ComboBox from "../../UI/Form/ComboBox";

const OPTION_AMOUNT = 10;

const ALN_NUMBER_OPTIONS = Array.from({ length: OPTION_AMOUNT }, (_, i) => ({
    id: i + 1,
    title: String(i + 1),
    order: i + 1
}));

/**
 * A multiselect combobox for choosing ALN Numbers from a fixed placeholder list (1-10).
 * @param {Object} props - The component props.
 * @param {number[]} props.selectedAlnNumbers - The currently selected ALN Numbers.
 * @param {Function} props.setSelectedAlnNumbers - A function to call when the selected ALN Numbers change. Called with an array of numbers.
 * @param {Function} [props.onChange] - A function to call when the input value changes (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {string} [props.legendClassName] - Additional CSS classes to apply to the label/legend (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const AlnNumbersComboBox = ({
    selectedAlnNumbers,
    setSelectedAlnNumbers,
    defaultString = "-Select an option-",
    onChange = () => {},
    overrideStyles = {},
    legendClassName = "usa-label margin-top-0",
    className
}) => {
    const selectedData = (selectedAlnNumbers ?? []).map((number) => ({ id: number, title: String(number) }));

    const handleChange = (selectedOptions) => {
        const alnNumbers = (selectedOptions ?? []).map((option) => option.id);
        setSelectedAlnNumbers(alnNumbers);
        onChange("aln_numbers", alnNumbers);
    };

    return (
        <div className={"usa-form-group width-card-lg " + (className || "")}>
            <label
                className={legendClassName}
                htmlFor="aln-numbers-combobox-input"
            >
                ALN Numbers
            </label>
            <span className="usa-hint">Select all that apply</span>
            <ComboBox
                selectedData={selectedData}
                setSelectedData={handleChange}
                namespace="aln-numbers-combobox"
                data={ALN_NUMBER_OPTIONS}
                optionText={(alnNumber) => alnNumber.title}
                defaultString={defaultString}
                overrideStyles={overrideStyles}
                isMulti={true}
            />
        </div>
    );
};

export default AlnNumbersComboBox;
