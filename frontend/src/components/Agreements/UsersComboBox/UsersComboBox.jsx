import { useGetUsersQuery } from "../../../api/opsAPI";
import cx from "clsx";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * A comboBox for choosing a user, filtered by authorized user IDs.
 * @param {Object} props - The component props.
 * @param {import("../../../types/UserTypes").SafeUser} props.selectedUser - The currently selected user type.
 * @param {string[]} [props.messages] - An array of error messages to display (optional).
 * @param {Function} props.setSelectedUser - A function to call when the selected user changes.
 * @param {string} [props.className] - Additional class names to apply to the component (optional).
 * @param {Function} [props.onChange] - Change handler function.
 * @param {string} [props.label] - The label for the input (optional).
 * @param {boolean} [props.isDisabled] - Whether the comboBox is disabled (optional).
 * @param {import("../../../types/UserTypes").SafeUser[] | null} [props.users] - Optional array of users to display. If not provided, users will be fetched from the API (optional).
 * @param {number[] | null | undefined} props.authorizedUserIds - Array of user IDs authorized for selection. Only these users will be shown. Required.
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
    users = null,
    authorizedUserIds
}) => {
    const {
        data: fetchedUsers,
        error: errorUsers,
        isLoading: isLoadingUsers
    } = useGetUsersQuery({}, { skip: users !== null });

    let userData = users ?? fetchedUsers;

    // Check if authorized users are configured
    const hasAuthorizedUsers = authorizedUserIds && Array.isArray(authorizedUserIds) && authorizedUserIds.length > 0;

    // Filter by authorized user IDs
    if (hasAuthorizedUsers && userData) {
        userData = userData.filter((user) => authorizedUserIds.includes(user.id));
    }

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

    // If no authorized users configured, show message
    if (!hasAuthorizedUsers) {
        return (
            <fieldset
                className={cx("usa-fieldset", className)}
                disabled={true}
            >
                <label
                    className="usa-label margin-0"
                    htmlFor="users-combobox-input"
                    id="users-label"
                >
                    {label}
                </label>
                <div className="usa-combo-box">
                    <input
                        type="text"
                        className="usa-combo-box__input"
                        id="users-combobox-input"
                        value="No Authorized Users"
                        disabled={true}
                        readOnly={true}
                    />
                </div>
            </fieldset>
        );
    }

    return (
        <fieldset
            className={cx("usa-fieldset", messages.length && "usa-form-group--error", className)}
            disabled={isDisabled}
        >
            <label
                className={`usa-label margin-0 ${messages.length > 0 ? "usa-label--error" : ""}`}
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
