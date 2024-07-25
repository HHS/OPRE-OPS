import React from "react";
import ComboBox from "../../UI/Form/ComboBox";
import { useGetUsersQuery } from "../../../api/opsAPI.js";

function UserEmailComboBox({ legendClassName = "usa-label margin-top-0" }) {
    const [selectedUsers, setSelectedUsers] = React.useState([]);

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
                className={legendClassName}
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

export default UserEmailComboBox;
