import PropTypes from "prop-types";
import Input from "../Input/Input";

export const EditUserForm = ({
    user,
    handleEditForm = () => {},
    handleSubmitForm = () => {},
    handleResetForm = () => {},
}) => {
    const dateJoined = new Date(user?.date_joined).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    return (
        <form className="usa-form usa-form--large">
            <fieldset className="usa-fieldset">
                <Input name="first-name" label="First or Given Name" value={user?.first_name} />
                <Input name="last-name" label="Last or Family Name" value={user?.last_name} />
                <Input name="email" label="Email Address" value={user?.email} />
                <Input name="division" label="Division" value={user?.division} />
                <Input name="roles" label="Roles" value={user?.roles} disabled />
                <Input name="date-joined" label="Date Joined" value={dateJoined} disabled={true} />
                <Input name="oidc-id" label="OIDC ID" value={user?.oidc_id} disabled />
                <Input name="hhs-id" label="HHS ID" value={user?.hhs_id} disabled />
            </fieldset>
        </form>
    );
};

EditUserForm.propTypes = {
    user: PropTypes.object.isRequired,
    handleEditForm: PropTypes.func.isRequired,
    handleSubmitForm: PropTypes.func.isRequired,
    handleResetForm: PropTypes.func.isRequired,
};

export default EditUserForm;
