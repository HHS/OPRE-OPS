import { useGetUsersQuery } from "../../../api/opsAPI";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * A comboBox for choosing a user.
 * @param {Object} props - The component props.
 * @param {import("../../../types/UserTypes").SafeUser} props.selectedUser - The currently selected user type.
 * @param {Function} props.setSelectedUser - A function to call when the selected user changes.
 * @param {string} [props.label] - The label for the input (optional).
 * @param {boolean} [props.isDisabled] - Whether the comboBox is disabled (optional).
 * @returns
 */

const UsersComboBox = ({ selectedUser, setSelectedUser, label = "Choose a user", isDisabled = false }) => {
    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery({});

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Error loading users.</div>;
    }

    const handleChange = (user) => {
        setSelectedUser(user);
        // onChange("user", user.id);
    };

    return (
        <fieldset
            className="usa-fieldset"
            disabled={isDisabled}
        >
            <label
                // className={`${legendClassname} ${messages.length ? "usa-label--error" : ""}`}
                htmlFor="users-combobox-input"
                id="users-label"
            >
                {label}
            </label>
            <ComboBox
                namespace="users-combobox"
                data={users}
                selectedData={selectedUser}
                setSelectedData={handleChange}
                // defaultString={defaultString}
                optionText={(user) => user.full_name || user.email}
                // overrideStyles={overrideStyles}
                // messages={messages}
                isDisabled={isDisabled}
            />
        </fieldset>
    );
};

export default UsersComboBox;
