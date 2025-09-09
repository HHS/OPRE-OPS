import { useNavigate } from "react-router-dom";
import { useGetUsersQuery } from "../../../api/opsAPI.js";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * @component - Renders a ComboBox for selecting users by email.
 * @param {import("../../../types/UserTypes").User[]} selectedUsers - The selected users.
 * @param {Function} setSelectedUsers - The function to set the selected users.
 * @returns {React.ReactElement} - The rendered component.
 */
function UserEmailComboBox({ selectedUsers, setSelectedUsers }) {
    const navigate = useNavigate();
    /** @type {{data?: import("../../../types/UserTypes").User[] | undefined, error?: Object, isLoading: boolean}} */
    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery({});

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        navigate("/error");
    }

    return (
        <div className="display-flex flex-column width-full">
            <label htmlFor="user-email-combobox-input">User</label>
            <p className="usa-hint margin-top-neg-2px margin-bottom-1">Select all that apply</p>
            <ComboBox
                selectedData={selectedUsers}
                setSelectedData={setSelectedUsers}
                namespace="user-email-combobox"
                data={users}
                defaultString="-- Select User --"
                optionText={(user) => user.full_name || user.email}
                isMulti={true}
            />
        </div>
    );
}

export default UserEmailComboBox;
