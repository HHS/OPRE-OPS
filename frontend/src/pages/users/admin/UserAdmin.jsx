import App from "../../../App";
import UserEmailComboBox from "../../../components/Users/UserEmailComboBox/index.js";
import React from "react";
import UserInfo from "../../../components/Users/UserInfo/UserInfo.jsx";

const UserAdmin = () => {
    const [selectedUsers, setSelectedUsers] = React.useState([]);

    return (
        <App breadCrumbName="User Admin">
            <h1 className={`font-sans-2xl margin-0 text-brand-primary`}>User Management</h1>
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
                            className="margin-top-2"
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
