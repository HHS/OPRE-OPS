import { useState } from "react";
import { callBackend } from "../../../helpers/backend";
import Input from "../../UI/Form/Input/Input";

const EditUserForm = ({ user }) => {
    const [formData, setFormData] = useState({
        id: user?.id,
        firstName: user?.first_name || "",
        lastName: user?.last_name || "",
        email: user?.email || "",
        division: user?.division || "",
        oidcId: user?.oidc_id || "",
        hhsId: user?.hhs_id || "",
    });

    function handleChange(event) {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [event.target.name]: event.target.value,
        }));
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await callBackend(`/api/v1/users/${formData.id}`, "PUT", formData);
            console.log(response.data);
            // handle success
        } catch (error) {
            console.error(error);
            // handle error
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                name="firstName"
                label="First or Given Name"
                defaultValue={formData?.firstName}
                onChange={handleChange}
            />
            <Input name="lastName" label="Last or Family Name" value={formData?.lastName} onChange={handleChange} />
            <Input name="email" label="Email Address" value={formData?.email} onChange={handleChange} />
            <Input name="division" label="Division" value={formData?.division} onChange={handleChange} />
            <Input name="oidcId" label="OIDC ID" value={formData?.oidcId} onChange={handleChange} />
            <Input name="hhsId" label="HHS ID" value={formData?.hhsId} onChange={handleChange} />
            <button className="usa-button" type="submit" onSubmit={handleSubmit}>
                Save Changes
            </button>
        </form>
    );
};
export default EditUserForm;
