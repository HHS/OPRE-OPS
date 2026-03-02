import ComboBox from "../../UI/Form/ComboBox";

const AWARD_TYPE_OPTIONS = [
    { id: 1, title: "New Award", awardType: "NEW" },
    { id: 2, title: "Continuing Agreement", awardType: "CONTINUING" }
];

/**
 * A comboBox for choosing Award Type(s).
 * @param {Object} props - The component props.
 * @param {object[]} props.selectedAwardTypes - The currently selected award types.
 * @param {Function} props.setSelectedAwardTypes - A function to call when the selected award types change.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const AwardTypeComboBox = ({
    selectedAwardTypes,
    setSelectedAwardTypes,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {}
}) => {
    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="award-type-combobox-input"
                >
                    Award Type
                </label>
                <div>
                    <ComboBox
                        namespace="award-type-combobox"
                        data={AWARD_TYPE_OPTIONS}
                        selectedData={selectedAwardTypes}
                        setSelectedData={setSelectedAwardTypes}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default AwardTypeComboBox;
