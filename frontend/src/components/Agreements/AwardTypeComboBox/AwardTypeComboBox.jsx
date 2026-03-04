import { AWARD_TYPE_LABELS } from "../../../pages/agreements/agreements.constants";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * @typedef {Object} AwardTypeOption
 * @property {number} id - Unique identifier for the option.
 * @property {string} title - Display label for the award type.
 * @property {string} awardType - The award type code (e.g., "NEW", "CONTINUING").
 */

/** @type {AwardTypeOption[]} */
const AWARD_TYPE_OPTIONS = Object.entries(AWARD_TYPE_LABELS).map(([code, label], index) => ({
    id: index + 1,
    title: label,
    awardType: code
}));

/**
 * A comboBox for choosing Award Type(s).
 * @param {Object} props - The component props.
 * @param {AwardTypeOption[]} props.selectedAwardTypes - The currently selected award types.
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
