import { useGetUsersQuery } from "../../../api/opsAPI";
import cx from "clsx";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * A comboBox for choosing a user.
 * @param {Object} props - The component props.
 * @param {import("../../../types/UserTypes").SafeUser} props.selectedUser - The currently selected user type.
 * @param {string[]} [props.messages] - An array of error messages to display (optional).
 * @param {Function} props.setSelectedUser - A function to call when the selected user changes.
 * @param {Function} [props.onChange] - Change handler function.
 * @param {string} [props.label] - The label for the input (optional).
 * @param {boolean} [props.isDisabled] - Whether the comboBox is disabled (optional).
 * @returns {React.ReactElement} The UsersComboBox component.
 */
const UsersComboBox = ({
    selectedUser,
    setSelectedUser,
    messages = [],
    onChange = () => {},
    label = "Choose a user",
    isDisabled = false
}) => {
    // TODO: Consider querying for only team members or matching returned users and filter by team members
    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery({});

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Error loading users.</div>;
    }

    const handleChange = (user) => {
        setSelectedUser(user);
        onChange("users_combobox", +user?.id);
    };

    return (
        <fieldset
            className={cx("usa-fieldset", messages.length && "usa-form-group--error")}
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
                name="users_combobox"
                namespace="users-combobox"
                data={users}
                selectedData={selectedUser}
                setSelectedData={handleChange}
                optionText={(user) => user.full_name || user.email}
                isDisabled={isDisabled}
            />
        </fieldset>
    );
};

export default UsersComboBox;
