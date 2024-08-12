import ComboBox from "../../UI/Form/ComboBox";
import { useGetUsersQuery } from "../../../api/opsAPI.js";
import PropTypes from "prop-types";

/**
 * Renders a ComboBox for selecting users by email.
 * @param {Array<any>} selectedUsers - The selected users.
 * @param {Function} setSelectedUsers - The function to set the selected users.
 * @returns {JSX.Element} - The rendered component.
 */
function UserEmailComboBox({ selectedUsers, setSelectedUsers }) {
    // const [selectedUsers, setSelectedUsers] = React.useState([]);

    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery();

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Oops, an error occurred</div>;
    }

    return (
        <div className="display-flex flex-column width-full">
            <label
                // className={legendClassName}
                htmlFor="user-email-combobox-input"
            >
                User
            </label>
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

UserEmailComboBox.propTypes = {
    selectedUsers: PropTypes.array.isRequired,
    setSelectedUsers: PropTypes.func.isRequired
};

export default UserEmailComboBox;
