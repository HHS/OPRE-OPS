import styles from "./UserInfoForm.module.css";
import RoundedBox from "../../UI/RoundedBox/RoundedBox";
import { useSelector } from "react-redux";
import Input from "../../UI/Form/Input/Input";
import classnames from "vest/classnames";
import { create, test, enforce, only } from "vest";

const UserInfoForm = () => {
    const user = useSelector((state) => state.userDetailEdit.user);

    const suite = create((data = {}, fieldName) => {
        only(fieldName);

        test("agreement-title", "This is required information", () => {
            enforce(data["agreement-title"]).isNotBlank();
        });
    });

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning",
    });

    return (
        <div className={styles.container}>
            <h1 className="font-sans-lg">New User Registration</h1>
            <p>Confirm / Update your details below.</p>
            <RoundedBox>
                <Input
                    name="oidcId"
                    label="OIDC ID"
                    className={cn("provider-id")}
                    value={user?.oidc_id}
                    onChange={null}
                />
                <Input name="email" label="Email" className={cn("user-email")} value={user?.email} onChange={null} />
                <Input
                    name="firstName"
                    label="First Name"
                    className={cn("user-fname")}
                    value={user?.first_name}
                    onChange={null}
                />
                <Input
                    name="lastName"
                    label="Last Name"
                    className={cn("user-lname")}
                    value={user?.last_name}
                    onChange={null}
                />
            </RoundedBox>
        </div>
    );
};

export default UserInfoForm;
