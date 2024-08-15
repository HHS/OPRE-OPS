import App from "../../../App";
import UserEmailComboBox from "../../../components/Users/UserEmailComboBox";
import React from "react";
import UserInfo from "../../../components/Users/UserInfo";

/**
 * Renders the User Admin page.
 * @returns {JSX.Element} - The rendered component.
 */
const UserAdmin = () => {
    const [selectedUsers, setSelectedUsers] = React.useState([]);

    return (
        <App breadCrumbName="User Admin">
            <h1 className={`font-sans-2xl margin-0 text-brand-primary`}>User Management</h1>
            <p className="margin-top-1">Select the users you want to edit, and then update their access below.</p>
            <div>
                <section className="display-flex flex-justify margin-top-3">
                    <UserEmailComboBox
                        selectedUsers={selectedUsers}
                        setSelectedUsers={setSelectedUsers}
                    />
                </section>
                {selectedUsers?.length > 0 &&
                    selectedUsers.map((user) => (
                        <section
                            key={user.id}
                            className="margin-5"
                        >
                            <UserInfo
                                user={user}
                                isEditable={true}
                            />
                        </section>
                    ))}
            </div>
        </App>
    );
};

export default UserAdmin;
