import ComboBox from "../ComboBox";

/**
 * A labelled multi-select ComboBox for filtering by a single field. Parameterizes the
 * label, namespace and option-text accessor so one component can back any filter
 * (procurement shop, division, etc.) without duplicating the wrapper markup.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.label - The visible label text for the field.
 * @param {string} props.namespace - A unique namespace prefix for the ComboBox (also drives the input id).
 * @param {Object[]} props.options - All the selectable options.
 * @param {Object[]} props.selected - The currently selected options.
 * @param {Function} props.setSelected - A function to call to set the selected options.
 * @param {(item: any) => string} props.optionText - Returns the display text for an option.
 * @param {string} [props.legendClassname] - The class name for the label (optional).
 * @param {string} [props.defaultString] - The default string to display (optional).
 * @param {Object} [props.overrideStyles] - The CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered filter ComboBox component.
 */
const FilterComboBox = ({
    label,
    namespace,
    options,
    selected,
    setSelected,
    optionText,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {}
}) => {
    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor={`${namespace}-input`}
                >
                    {label}
                </label>
                <div>
                    <ComboBox
                        namespace={namespace}
                        data={options}
                        selectedData={selected}
                        setSelectedData={setSelected}
                        optionText={optionText}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default FilterComboBox;
