import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useGetDivisionsQuery, useUpdateUserMutation } from "../../../api/opsAPI.js";
import { useGetRolesQuery } from "../../../api/opsAuthAPI.js";
import constants from "../../../constants.js";
import useAlert from "../../../hooks/use-alert.hooks.js";
import { setIsActive } from "../../UI/Alert/alertSlice.js";
import ComboBox from "../../UI/Form/ComboBox/index.js";
import { USER_STATUS } from "./UserInfo.constants.js";
import { useNavigate } from "react-router-dom";

/**
 * Renders the user information.
 * @component
 * @typedef {import("../../../types/UserTypes.js").SafeUser} User
 * @param {Object} props - The component props.
 * @param {User} props.user - The user object.
 * @param {Boolean} props.isEditable - Whether the user information is editable.
 * @returns {React.ReactElement} - The rendered component.
 */
const UserInfo = ({ user, isEditable }) => {
    const navigate = useNavigate();
    const { setAlert } = useAlert();
    const dispatch = useDispatch();

    const [selectedDivision, setSelectedDivision] = React.useState({});
    const [selectedStatus, setSelectedStatus] = React.useState({});
    const [selectedRoles, setSelectedRoles] = React.useState([]);
    const statusData = useMemo(
        () => [
            { id: 1, name: USER_STATUS.ACTIVE },
            { id: 2, name: USER_STATUS.INACTIVE },
            { id: 3, name: USER_STATUS.LOCKED }
        ],
        []
    );
    /** @type {{data?: import("../../../types/PortfolioTypes.js").Division[] | undefined, error?: Object, isLoading: boolean}} */
    const { data: divisions, error: errorDivisions, isLoading: isLoadingDivisions } = useGetDivisionsQuery({});
    const { data: roles, error: errorRoles, isLoading: isLoadingRoles } = useGetRolesQuery({});
    const [updateUser, updateUserResult] = useUpdateUserMutation();

    const processedRoles = useMemo(() => {
        return (
            roles?.map((role) => ({
                id: role.id,
                name: role.name,
                label: constants.roles.find((r) => r.name === role.name)?.label || role.name // fallback
            })) ?? []
        );
    }, [roles]);

    useEffect(() => {
        setSelectedDivision(divisions?.find((division) => division.id === user.division));
        setSelectedStatus(statusData.find((status) => status.name === user.status));

        setSelectedRoles(processedRoles?.filter((role) => user.roles?.some((userRole) => userRole.name === role.name)));

        return () => {
            setSelectedDivision([]);
            setSelectedStatus([]);
            setSelectedRoles([]);
        };
    }, [divisions, roles, user, statusData, processedRoles]);

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
    }, [updateUserResult, dispatch, setAlert]);
    const handleDivisionChange = (division) => {
        setSelectedDivision(division);
        updateUser({ id: user.id, data: { division: division ? division.id : null } });
    };

    const handleRolesChange = (roles) => {
        setSelectedRoles(roles);
        const roleNames = roles?.map((role) => constants.roles.find((r) => r.name === role.name)?.name);
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
        navigate("/error");
        return;
    }
    if (updateUserResult.isError) {
        navigate("/error");
        return;
    }

    return (
        <div className="usa-card">
            <div className="usa-card__container">
                <div className="usa-card__header">
                    <h1 className="usa-card__heading">{user.full_name}</h1>
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
                                {!isEditable && (
                                    <span>
                                        {selectedRoles
                                            ?.map((role) => constants.roles.find((r) => r.name === role.name)?.label)
                                            .join(", ")}
                                    </span>
                                )}
                                {isEditable && (
                                    <div data-testid="roles-combobox">
                                        <ComboBox
                                            namespace="roles-combobox"
                                            data={processedRoles}
                                            selectedData={selectedRoles}
                                            setSelectedData={handleRolesChange}
                                            defaultString="-- Select Roles --"
                                            optionText={(role) =>
                                                constants.roles.find((r) => r.name === role.name)?.label
                                            }
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

export default UserInfo;
