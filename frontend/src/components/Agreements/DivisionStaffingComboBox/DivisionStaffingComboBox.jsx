import { Children, cloneElement, useMemo } from "react";
import { components, createFilter } from "react-select";
import ComboBox from "../../UI/Form/ComboBox";
import {
    buildDivisionStaffingOptions,
    splitSelectedOptions,
    toSelectedOptions
} from "./DivisionStaffingComboBox.helpers";

/**
 * While a division option has focus (by hover or arrow keys), its CORs get the same light highlight,
 * so the user can see who the division covers. Only the focused option is announced; the CORs'
 * labels already name their division, so the highlight is visual only.
 * @param {Object} props - react-select MenuList props.
 * @returns {React.ReactElement} - The menu list.
 */
const GroupHighlightMenuList = (props) => {
    const focused = Children.toArray(props.children).find((child) => child.props?.isFocused);
    const focusedData = focused?.props.data;
    // A division option's group is its own id, so this is true only when a division has focus.
    const focusedGroup = focusedData?.group && focusedData.group === focusedData.value ? focusedData.group : null;

    const children = focusedGroup
        ? Children.map(props.children, (child) =>
              child.props?.data?.group === focusedGroup && !child.props.isFocused
                  ? cloneElement(child, {
                        className: "division-staffing-combobox__option--in-focused-group",
                        innerProps: {
                            ...child.props.innerProps,
                            style: { backgroundColor: child.props.theme.colors.primary25 }
                        }
                    })
                  : child
          )
        : props.children;

    return <components.MenuList {...props}>{children}</components.MenuList>;
};

const MENU_COMPONENTS = { MenuList: GroupHighlightMenuList };

// Match typed text against the label only. Option values are internal ids ("cor-21", "division-1"),
// so the shared filter's value matching would make "cor" or a digit match unrelated options.
const filterByLabel = createFilter({ stringify: (option) => option.label });

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
                        components={MENU_COMPONENTS}
                        filterOption={filterByLabel}
                    />
                </div>
            </div>
        </div>
    );
};

export default DivisionStaffingComboBox;
