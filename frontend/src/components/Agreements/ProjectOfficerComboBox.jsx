import cx from "clsx";
import { useGetUsersQuery } from "../../api/opsAPI";
import ComboBox from "../UI/Form/ComboBox";
import { useNavigate } from "react-router-dom";
const LOCKED_MESSAGE_ID = "project-officer-combobox-input-locked-message";

/**
 *  A comboBox for choosing a project officer.
 * @param {Object} props - The component props.
 * @param {import("../../types/UserTypes").SafeUser} props.selectedProjectOfficer - The currently selected agreement type.
 * @param {Function} props.setSelectedProjectOfficer - A function to call when the selected agreement type changes.
 * @param {string} props.label - The label for the input (optional).
 * @param {string[]} [props.messages] - An array of error messages to display (optional).
 * @param {Function} [props.onChange] - A function to call when the input value changes (optional).
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @param {boolean} [props.isDisabled] - Whether the selection is locked (optional).
 * @param {string} [props.disabledMessage] - Why it's locked, shown as a hint and tooltip (optional).
 * @returns {React.ReactElement} - The rendered component.
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
    className,
    label,
    isDisabled = false,
    disabledMessage = ""
}) => {
    const navigate = useNavigate();
    const {
        data: users,
        error: errorUsers,
        isLoading: isLoadingUsers
    } = useGetUsersQuery({ excludeReadOnlyUsers: true, excludeSystemAdmin: true });

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        navigate("/error");
        return;
    }

    const showLockedMessage = Boolean(isDisabled && disabledMessage);

    const handleChange = (user) => {
        setSelectedProjectOfficer(user);
        onChange("project_officer", user?.id ?? null);
    };

    return (
        <div
            className={cx(
                "usa-form-group margin-top-0",
                messages.length && "usa-form-group--error",
                pending && "pending",
                className
            )}
            // react-select hides a disabled input from assistive tech (visibility: hidden), so
            // aria on the input is never read. When locked, name the field's group and describe
            // it with the reason instead; the reason also follows the value in reading order.
            // aria-label rather than aria-labelledby: the COR and Alternate COR boxes share
            // the label's id.
            {...(showLockedMessage && {
                role: "group",
                "aria-label": label,
                "aria-describedby": LOCKED_MESSAGE_ID
            })}
        >
            <label
                className={`${legendClassname} ${messages.length ? "usa-label--error" : ""}`}
                htmlFor="project-officer-combobox-input"
                id="project-officer-label"
            >
                {label}
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
                    optionText={(user) => user.display_name || user.full_name || user.email}
                    overrideStyles={overrideStyles}
                    messages={messages}
                    isDisabled={isDisabled}
                    tooltipMsg={disabledMessage}
                />
            </div>
            {/* Below the field, so the COR and Alternate COR boxes stay level side by side. */}
            {showLockedMessage && (
                <span
                    className="usa-hint display-block margin-top-1"
                    id={LOCKED_MESSAGE_ID}
                    data-cy="project-officer-locked-message"
                    style={{ maxWidth: overrideStyles.width }}
                >
                    {disabledMessage}
                </span>
            )}
        </div>
    );
};

export default ProjectOfficerComboBox;
