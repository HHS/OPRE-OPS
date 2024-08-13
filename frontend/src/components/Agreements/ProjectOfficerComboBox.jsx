import cx from "clsx";
import PropTypes from "prop-types";
import { useGetUsersQuery } from "../../api/opsAPI";
import ComboBox from "../UI/Form/ComboBox";
/**
 *  A comboBox for choosing a project officer.
 * @param {Object} props - The component props.
 * @param {string} props.selectedProjectOfficer - The currently selected agreement type.
 * @param {Function} props.setSelectedProjectOfficer - A function to call when the selected agreement type changes.
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {Function} [props.onChange] - A function to call when the input value changes (optional).
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const ProjectOfficerComboBox = ({
    selectedProjectOfficer,
    setSelectedProjectOfficer,
    messages = [],
    onChange = () => {},
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    pending = false,
    className
}) => {
    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery();

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Oops, an error occurred</div>;
    }

    const handleChange = (user) => {
        setSelectedProjectOfficer(user);
        onChange("project_officer", user.id);
    };

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
                className={` ${legendClassname} ${messages.length ? "usa-label--error" : ""}`}
                htmlFor="project-officer-combobox-input"
                id="project-officer-label"
            >
                Project Officer
            </label>
            {messages?.length > 0 && (
                <span
                    className="usa-error-message"
                    id="project-officer-combobox-input-error-message"
                    role="alert"
                >
                    {messages[0]}
                </span>
            )}
            <div>
                <ComboBox
                    namespace="project-officer-combobox"
                    data={users}
                    selectedData={selectedProjectOfficer}
                    setSelectedData={handleChange}
                    defaultString={defaultString}
                    optionText={(user) => user.full_name || user.email}
                    overrideStyles={overrideStyles}
                    messages={messages}
                />
            </div>
        </div>
    );
};

ProjectOfficerComboBox.propTypes = {
    selectedProjectOfficer: PropTypes.object,
    setSelectedProjectOfficer: PropTypes.func.isRequired,
    messages: PropTypes.array,
    onChange: PropTypes.func,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
    overrideStyles: PropTypes.object,
    className: PropTypes.string,
    pending: PropTypes.bool
};

export default ProjectOfficerComboBox;
