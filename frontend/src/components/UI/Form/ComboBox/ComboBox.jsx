import Select, { components, createFilter } from "react-select";
import useComboBox from "./ComboBox.hooks";
import Tooltip from "../../USWDS/Tooltip";
import styles from "./ComboBox.module.css";

const LoadingMessage = (props) => (
    <components.LoadingMessage {...props}>
        <div
            className={styles.loadingMenu}
            data-testid="combobox-loading-skeleton"
            role="status"
            aria-live="polite"
        >
            <span className={styles.srOnly}>Loading options</span>
            {Array.from({ length: 5 }, (_, index) => (
                <div
                    key={index}
                    className={styles.loadingRow}
                />
            ))}
        </div>
    </components.LoadingMessage>
);

// Widens react-select's default filter to also match against a hidden `searchText` field
// (e.g. an agreement's full name/nickname pair) so typing either resolves to the same option.
// Must keep `option.value` in the stringify — react-select's own defaultStringify is
// `${label} ${value}` (Select-ef7c0426.esm.js), and several ComboBoxes (e.g.
// ProjectTypeComboBox) use a human-typeable code as the id/value with no `searchText`, so
// dropping `value` here breaks matching on it for every ComboBox in the app. Ref: issue #6144 AC 3.
const filterOption = createFilter({
    stringify: (option) => `${option.label} ${option.value} ${option.data?.searchText ?? ""}`
});

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
 * @param {DataProps[]} props.selectedData - The currently selected data item.
 * @param {Function} props.setSelectedData - A function to call when the selected item changes.
 * @param {Function} [props.optionText] - A function to call that returns a string that provides the option text.
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {string[]} [props.messages] - An array of error messages to display (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {boolean} [props.clearWhenSet] - Whether to clear the box when an option is selected. Used for TeamMemberComboBox. (optional).
 * @param {boolean} [props.isMulti] - Whether to allow multiple selections.
 * @param {boolean} [props.isDisabled]
 * @param {boolean} [props.isLoading]
 * @param {string} [props.tooltipMsg] - Tooltip message to display (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
const ComboBox = ({
    namespace,
    data,
    selectedData,
    setSelectedData,
    optionText = (data) => data.display_name ?? data.title,
    defaultString = "",
    messages = [],
    overrideStyles = {},
    clearWhenSet = false,
    isMulti = false,
    isDisabled = false,
    isLoading = false,
    tooltipMsg = ""
}) => {
    const { selectedOption, options, customStyles, handleChange, defaultOption, shiftHeld } = useComboBox(
        data,
        selectedData,
        setSelectedData,
        optionText,
        overrideStyles,
        clearWhenSet,
        isMulti
    );

    return (
        <div style={isDisabled ? { cursor: "not-allowed" } : {}}>
            {isDisabled ? (
                <Tooltip
                    label={tooltipMsg}
                    position="right"
                >
                    <Select
                        inputId={`${namespace}-input`}
                        className={"padding-top-05"}
                        classNamePrefix={namespace}
                        name={namespace}
                        tabIndex={0}
                        value={defaultOption ?? selectedOption ?? ""}
                        styles={customStyles}
                        isSearchable={true}
                        isClearable={true}
                        isDisabled={true}
                    />
                </Tooltip>
            ) : (
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
                    components={{ LoadingMessage }}
                    filterOption={filterOption}
                    isSearchable={true}
                    isClearable={true}
                    isMulti={isMulti}
                    closeMenuOnSelect={isMulti ? !shiftHeld : true}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default ComboBox;
