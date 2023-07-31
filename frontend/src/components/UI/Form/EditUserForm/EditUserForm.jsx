import PropTypes from "prop-types";
import Input from "../Input/Input";
import { useState } from "react";
import { callBackend } from "../../../../helpers/backend";

export const EditUserForm = ({ user }) => {
    const [formData, setFormData] = useState({
        firstName: user?.first_name || "",
        lastName: user?.last_name || "",
        email: user?.email || "",
        division: user?.division || "",
        roles: user?.roles || "",
        dateJoined: user?.date_joined || "",
        oidcId: user?.oidc_id || "",
        hhsId: user?.hhs_id || "",
    });

    const handleChange = (event) => {
        if (event && event.target) {
            const { name, value } = event.target;
            setFormData((prevFormData) => ({
                ...prevFormData,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await callBackend("PUT", `/api/users/${user.id}`, formData);
            console.log(response.data);
            // handle success
        } catch (error) {
            console.error(error);
            // handle error
        }
    };

    const dateJoined = new Date(formData?.date_joined).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    return (
        <form className="usa-form usa-form--large">
            <fieldset className="usa-fieldset">
                <Input
                    name="first-name"
                    label="First or Given Name"
                    value={formData?.first_name}
                    onChange={(event) => handleChange(event)}
                />
                <Input
                    name="last-name"
                    label="Last or Family Name"
                    value={formData?.last_name}
                    onChange={(event) => handleChange(event)}
                />
                <Input
                    name="email"
                    label="Email Address"
                    value={formData?.email}
                    onChange={(event) => handleChange(event)}
                />
                <Input
                    name="division"
                    label="Division"
                    value={formData?.division}
                    onChange={(event) => handleChange(event)}
                />
                <Input
                    name="roles"
                    label="Roles"
                    value={formData?.roles}
                    disabled
                    onChange={(event) => handleChange(event)}
                />
                <Input
                    name="date-joined"
                    label="Date Joined"
                    value={dateJoined}
                    disabled={true}
                    onChange={(event) => handleChange(event)}
                />
                <Input
                    name="oidc-id"
                    label="OIDC ID"
                    value={formData?.oidc_id}
                    disabled={true}
                    onChange={(event) => handleChange(event)}
                />
                <Input
                    name="hhs-id"
                    label="HHS ID"
                    value={formData?.hhs_id}
                    disabled={true}
                    onChange={(event) => handleChange(event)}
                />

                <button
                    id="edit-user-submit"
                    className="usa-button usa-button--outline margin-top-2 float-right margin-right-0"
                    type="submit"
                >
                    Save Changes
                </button>
            </fieldset>
        </form>
    );
};

EditUserForm.propTypes = {
    user: PropTypes.object.isRequired,
};

export default EditUserForm;
