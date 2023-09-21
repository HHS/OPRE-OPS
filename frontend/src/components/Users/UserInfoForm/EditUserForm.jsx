import { useState } from "react";
import { callBackend } from "../../../helpers/backend";
import Input from "../../UI/Form/Input/Input";
import { useNavigate } from "react-router-dom";
// import { useUpdateUserMutation } from "../../../api/opsAPI";

const EditUserForm = ({ user }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        id: user?.id,
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        division: user?.division || "",
        oidc_id: user?.oidc_id || "",
        hhs_id: user?.hhs_id || ""
    });

    // const [updateUser] = useUpdateUserMutation();

    function handleChange(event) {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [event.target.name]: event.target.value
        }));
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            console.log(`Initial Form Data: ${JSON.stringify(formData)}`);
            // Future refactor to RTK Query

            const updatedUser = await callBackend(`/api/v1/users/${formData.id}`, "PUT", formData);
            navigate(`/users/${updatedUser.id}`);
            // handle success
        } catch (error) {
            console.error(error);
            // handle error
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                name="first_name"
                label="First or Given Name"
                defaultValue={formData?.first_name}
                onChange={handleChange}
            />
            <Input
                name="last_name"
                label="Last or Family Name"
                value={formData?.last_name}
                onChange={handleChange}
            />
            <Input
                name="email"
                label="Email Address"
                value={formData?.email}
                onChange={handleChange}
            />
            <Input
                name="division"
                label="Division"
                value={formData?.division}
                onChange={handleChange}
            />
            <Input
                name="oidcId"
                label="OIDC ID"
                value={formData?.oidc_id}
                onChange={handleChange}
            />
            <Input
                name="hhsId"
                label="HHS ID"
                value={formData?.hhs_id}
                onChange={handleChange}
            />
            <button
                className="usa-button"
                type="submit"
                onSubmit={handleSubmit}
            >
                Save Changes
            </button>
        </form>
    );
};
export default EditUserForm;
