import PropTypes from "prop-types";
import cx from "clsx";
import ComboBox from "../../UI/Form/ComboBox";
import { useGetCansQuery } from "../../../api/opsAPI";

/**
 *  A comboBox for choosing a CAN
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {number} props.selectedCan - The currently selected agreement type.
 * @param {Function} props.setSelectedCan - A function to call when the selected agreement type changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const CanComboBox = ({
    name,
    label = name,
    selectedCan,
    setSelectedCan,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    onChange,
    pending = false,
    messages = [],
    className
}) => {
    /**
     * function to handle changes to the Can comboBox
     * @param {Object} can - The can object
     */
    const handleChange = (can) => {
        setSelectedCan(can);
        onChange(name, can);
    };

    const { data: canList, error: errorCanList, isLoading: isLoadingCanList } = useGetCansQuery();

    if (isLoadingCanList) {
        return <div>Loading...</div>;
    }
    if (errorCanList) {
        return <div>Oops, an error occurred</div>;
    }

    return (
        <div
            className={cx(
                "usa-form-group margin-top-0",
                messages.length && "usa-form-group--error",
                pending && "pending",
                className
            )}
        >
            <label
                className={`${legendClassname} ${messages.length ? "usa-label--error" : ""}`}
                htmlFor="can-combobox-input"
                id="can-label"
            >
                {label}
            </label>
            {messages.length > 0 && (
                <span
                    className="usa-error-message"
                    id="can-combobox-input-error-message"
                    role="alert"
                >
                    {messages[0]}
                </span>
            )}
            <div>
                <ComboBox
                    namespace="can-combobox"
                    data={canList}
                    selectedData={selectedCan}
                    setSelectedData={handleChange}
                    defaultString={defaultString}
                    optionText={(can) => can.display_name || can.number}
                    overrideStyles={overrideStyles}
                    messages={messages}
                />
            </div>
        </div>
    );
};

CanComboBox.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    selectedCan: PropTypes.object,
    setSelectedCan: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    messages: PropTypes.array,
    className: PropTypes.string,
    pending: PropTypes.bool,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
    overrideStyles: PropTypes.object
};
export default CanComboBox;
