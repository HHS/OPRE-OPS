import { useMemo } from "react";
import ComboBox from "../../UI/Form/ComboBox";
import {
    buildDivisionStaffingOptions,
    splitSelectedOptions,
    toSelectedOptions
} from "./DivisionStaffingComboBox.helpers";

/**
 * A comboBox for filtering by the primary COR's division ("Division & Staffing"): pick whole divisions,
 * individual CORs, or both. The backend matches an item on either one.
 * @param {Object} props - The component props.
 * @param {import("./DivisionStaffingComboBox.helpers").CorDivision[]} props.corDivisions - `cor_divisions` from the filter options.
 * @param {import("./DivisionStaffingComboBox.helpers").Cor[]} props.cors - `cors` from the filter options.
 * @param {import("./DivisionStaffingComboBox.helpers").CorDivision[]} props.selectedDivisions - The currently selected divisions.
 * @param {Function} props.setSelectedDivisions - Called with the selected divisions.
 * @param {import("./DivisionStaffingComboBox.helpers").Cor[]} props.selectedCors - The currently selected CORs.
 * @param {Function} props.setSelectedCors - Called with the selected CORs.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {boolean} [props.isLoading] - Whether the options are still loading (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const DivisionStaffingComboBox = ({
    corDivisions,
    cors,
    selectedDivisions,
    setSelectedDivisions,
    selectedCors,
    setSelectedCors,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    isLoading = false
}) => {
    const options = useMemo(() => buildDivisionStaffingOptions(corDivisions, cors), [corDivisions, cors]);
    const selectedOptions = useMemo(
        () => toSelectedOptions(selectedDivisions, selectedCors),
        [selectedDivisions, selectedCors]
    );

    const setSelectedOptions = (chosen) => {
        const { divisions, cors: chosenCors } = splitSelectedOptions(chosen);
        setSelectedDivisions(divisions);
        setSelectedCors(chosenCors);
    };

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="division-staffing-combobox-input"
                >
                    Division & Staffing
                </label>
                <div>
                    <ComboBox
                        namespace="division-staffing-combobox"
                        data={options}
                        selectedData={selectedOptions}
                        setSelectedData={setSelectedOptions}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default DivisionStaffingComboBox;
