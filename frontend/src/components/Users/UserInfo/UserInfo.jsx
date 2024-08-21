import { useGetDivisionsQuery, useUpdateUserMutation } from "../../../api/opsAPI.js";
import ComboBox from "../../UI/Form/ComboBox/index.js";
import React, { useEffect } from "react";
import { useGetRolesQuery } from "../../../api/opsAuthAPI.js";
import { USER_STATUS } from "./UserInfo.constants.js";
import PropTypes from "prop-types";
import useAlert from "../../../hooks/use-alert.hooks.js";
import { useDispatch } from "react-redux";
import { setIsActive } from "../../UI/Alert/alertSlice.js";

/**
 * Renders the user information.
 * @param {Object} user - The user object.
 * @param {Boolean} isEditable - Whether the user information is editable.
 * @returns {JSX.Element} - The rendered component.
 */
const UserInfo = ({ user, isEditable }) => {
    const { setAlert } = useAlert();
    const dispatch = useDispatch();

    const [selectedDivision, setSelectedDivision] = React.useState({});
    const [selectedStatus, setSelectedStatus] = React.useState({});
    const [selectedRoles, setSelectedRoles] = React.useState([]);
    const statusData = [
        { id: 1, name: USER_STATUS.ACTIVE },
        { id: 2, name: USER_STATUS.INACTIVE },
        { id: 3, name: USER_STATUS.LOCKED }
    ];

    const { data: divisions, error: errorDivisions, isLoading: isLoadingDivisions } = useGetDivisionsQuery();
    const { data: roles, error: errorRoles, isLoading: isLoadingRoles } = useGetRolesQuery();
    const [updateUser, updateUserResult] = useUpdateUserMutation();

    useEffect(() => {
        setSelectedDivision(divisions?.find((division) => division.id === user.division));
        setSelectedStatus(statusData.find((status) => status.name === user.status));
        setSelectedRoles(roles?.filter((role) => user.roles?.includes(role.name)));

        return () => {
            setSelectedDivision([]);
            setSelectedStatus([]);
            setSelectedRoles([]);
        };
    }, [divisions, roles, user]);

    useEffect(() => {
        if (updateUserResult.isSuccess) {
            setAlert({
                type: "success",
                heading: "User Updated",
                message: "The user has been updated successfully."
            });
            dispatch(setIsActive(true));
        }

        if (updateUserResult.isError) {
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while updating the user."
            });
            dispatch(setIsActive(true));
        }
    }, [updateUserResult]);

    const handleDivisionChange = (division) => {
        setSelectedDivision(division);
        updateUser({ id: user.id, data: { division: division ? division.id : null } });
    };

    const handleRolesChange = (roles) => {
        setSelectedRoles(roles);
        const roleNames = roles?.map((role) => role.name);
        updateUser({ id: user.id, data: { roles: roleNames || [] } });
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        updateUser({ id: user.id, data: { status: status ? status.name : "LOCKED" } });
    };

    if (isLoadingDivisions || isLoadingRoles) {
        return <div>Loading...</div>;
    }
    if (errorDivisions || errorRoles) {
        return <div>Oops, an error occurred</div>;
    }
    if (updateUserResult.isError) {
        return <div>Oops, an error occurred</div>;
    }

    return (
        <div className="usa-card">
            <div className="usa-card__container">
                <div className="usa-card__header">
                    <h4 className="usa-card__heading">{user.full_name}</h4>
                </div>
                <div className="usa-card__body">
                    <div className="font-sans-md line-height-sans-4 flex-align-center">
                        <div className="grid-row">
                            <div className="grid-col-4">User Email:</div>
                            <div className="grid-col-8">{user?.email}</div>
                        </div>
                        <div className="grid-row display-flex flex-align-center">
                            <div className="grid-col-4">Division:</div>
                            <div className="grid-col-8">
                                {!isEditable && <span>{selectedDivision?.name}</span>}
                                {isEditable && (
                                    <div data-testid="division-combobox">
                                        <ComboBox
                                            namespace="division-combobox"
                                            data={divisions}
                                            selectedData={selectedDivision}
                                            setSelectedData={handleDivisionChange}
                                            defaultString="-- Select Division --"
                                            optionText={(division) => division.name}
                                            isMulti={false}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid-row">
                            <div className="grid-col-4">Role(s):</div>
                            <div className="grid-col-8">
                                {!isEditable && <span>{selectedRoles?.map((role) => role.name).join(", ")}</span>}
                                {isEditable && (
                                    <div data-testid="roles-combobox">
                                        <ComboBox
                                            namespace="roles-combobox"
                                            data={roles}
                                            selectedData={selectedRoles}
                                            setSelectedData={handleRolesChange}
                                            defaultString="-- Select Roles --"
                                            optionText={(role) => role.name}
                                            isMulti={true}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid-row display-flex flex-align-center">
                            <div className="grid-col-4">Status:</div>
                            <div className="grid-col-8">
                                {!isEditable && <span>{selectedStatus?.name}</span>}
                                {isEditable && (
                                    <div data-testid="status-combobox">
                                        <ComboBox
                                            namespace="status-combobox"
                                            data={statusData}
                                            selectedData={selectedStatus}
                                            setSelectedData={handleStatusChange}
                                            defaultString="-- Select Status --"
                                            optionText={(status) => status.name}
                                            isMulti={false}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

UserInfo.propTypes = {
    user: PropTypes.object.isRequired,
    isEditable: PropTypes.bool
};

export default UserInfo;
