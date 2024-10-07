import PropTypes from "prop-types";
import Select from "react-select";
import useComboBox from "./ComboBox.hooks";

/**
 * @typedef {Object} DataProps
 * @property {number} id - The identifier of the data item
 * @property {string | number} title - The title of the data item
 */

/**
 *  A comboBox base composable.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.namespace - A unique name to use as a prefix for id, name, class, etc.
 * @param {DataProps[]} props.data - The data to choose from.
 * @param {Object | Array<any>} props.selectedData - The currently selected data item.
 * @param {Function} props.setSelectedData - A function to call when the selected item changes.
 * @param {Function} [props.optionText] - A function to call that returns a string that provides the option text.
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {boolean} [props.clearWhenSet] - Whether to clear the box when an option is selected. Used for TeamMemberComboBox. (optional).
 * @param {boolean} [props.isMulti] - Whether to allow multiple selections.
 * @returns {JSX.Element} - The rendered component.
 */
export const ComboBox = ({
    namespace,
    data,
    selectedData,
    setSelectedData,
    optionText = (data) => data.display_name ?? data.title,
    defaultString = "",
    messages = [],
    overrideStyles = {},
    clearWhenSet = false,
    isMulti = false
}) => {
    const { selectedOption, options, customStyles, handleChange, defaultOption } = useComboBox(
        data,
        selectedData,
        setSelectedData,
        optionText,
        overrideStyles,
        clearWhenSet
    );

    return (
        <Select
            inputId={`${namespace}-input`}
            className={`padding-top-05 ${messages.length ? "usa-input--error" : ""}`}
            classNamePrefix={namespace}
            name={namespace}
            tabIndex={0}
            value={defaultOption ?? selectedOption ?? ""}
            onChange={handleChange}
            options={options}
            placeholder={defaultString}
            styles={customStyles}
            isSearchable={true}
            isClearable={true}
            isMulti={isMulti}
        />
    );
};

export default ComboBox;

ComboBox.propTypes = {
    namespace: PropTypes.string.isRequired,
    data: PropTypes.array.isRequired,
    selectedData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    setSelectedData: PropTypes.func.isRequired,
    optionText: PropTypes.func,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
    messages: PropTypes.array,
    overrideStyles: PropTypes.object,
    clearWhenSet: PropTypes.bool,
    isMulti: PropTypes.bool
};
