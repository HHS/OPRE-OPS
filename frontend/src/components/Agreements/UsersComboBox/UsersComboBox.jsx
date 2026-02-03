import { useGetUsersQuery } from "../../../api/opsAPI";
import cx from "clsx";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * A comboBox for choosing a user.
 * @param {Object} props - The component props.
 * @param {import("../../../types/UserTypes").SafeUser} props.selectedUser - The currently selected user type.
 * @param {string[]} [props.messages] - An array of error messages to display (optional).
 * @param {Function} props.setSelectedUser - A function to call when the selected user changes.
 * @param {string} [props.className] - Additional class names to apply to the component (optional).
 * @param {Function} [props.onChange] - Change handler function.
 * @param {string} [props.label] - The label for the input (optional).
 * @param {boolean} [props.isDisabled] - Whether the comboBox is disabled (optional).
 * @param {import("../../../types/UserTypes").SafeUser[]} [props.users] - Optional array of users to display. If not provided, users will be fetched from the API (optional).
 * @returns {React.ReactElement} The UsersComboBox component.
 */
const UsersComboBox = ({
    selectedUser,
    setSelectedUser,
    className = "",
    messages = [],
    onChange = () => {},
    label = "Choose a user",
    isDisabled = false,
    users = null
}) => {
    // TODO: Consider querying for only team members or matching returned users and filter by team members
    const {
        data: fetchedUsers,
        error: errorUsers,
        isLoading: isLoadingUsers
    } = useGetUsersQuery({}, { skip: users !== null });

    const userData = users ?? fetchedUsers;

    if (isLoadingUsers && users === null) {
        return <div>Loading...</div>;
    }
    if (errorUsers && users === null) {
        return <div>Error loading users.</div>;
    }

    const handleChange = (user) => {
        setSelectedUser(user);
        onChange("users", user?.id ?? "");
    };

    return (
        <fieldset
            className={cx("usa-fieldset", messages.length && "usa-form-group--error", className)}
            disabled={isDisabled}
        >
            <label
                className={`${messages.length > 0 ? "usa-label--error" : ""}`}
                htmlFor="users-combobox-input"
                id="users-label"
            >
                {label}
            </label>
            {messages?.length > 0 && (
                <span
                    className="usa-error-message"
                    id="users-combobox-input-error-message"
                    role="alert"
                >
                    {messages[0]}
                </span>
            )}
            <ComboBox
                name="users"
                namespace="users-combobox"
                data={userData}
                selectedData={selectedUser}
                setSelectedData={handleChange}
                optionText={(user) => user.full_name || user.email}
                isDisabled={isDisabled}
                messages={messages}
            />
        </fieldset>
    );
};

export default UsersComboBox;
