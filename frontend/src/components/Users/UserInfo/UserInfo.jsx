import { useGetDivisionsQuery, useUpdateUserMutation } from "../../../api/opsAPI.js";
import ComboBox from "../../UI/Form/ComboBox/index.js";
import React, { useEffect } from "react";
import { useGetRolesQuery } from "../../../api/opsAuthAPI.js";
import { USER_STATUS } from "./UserInfo.constants.js";
import _ from "lodash";

const UserInfo = ({ user, isEditable }) => {
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

    const handleDivisionChange = (division) => {
        if (!_.isEmpty(division)) {
            setSelectedDivision(division);
            updateUser({ id: user.id, data: { division: division.id } });
        }
    };

    if (isLoadingDivisions || isLoadingRoles) {
        return <div>Loading...</div>;
    }
    if (errorDivisions || errorRoles) {
        return <div>Oops, an error occurred</div>;
    }
    if (updateUserResult.isError) {
        console.error(`Error Updating User ${updateUserResult.error}`);
        return <div>Oops, an error occurred</div>;
    }

    return (
        <div className="usa-card">
            <div className="usa-card__container">
                <div className="usa-card__header">
                    <h4 className="usa-card__heading">User Details</h4>
                </div>
                <div className="usa-card__body">
                    <div className="font-sans-md line-height-sans-4 flex-align-center">
                        <div className="grid-row">
                            <div className="grid-col">Name:</div>
                            <div className="grid-col">{user.full_name}</div>
                        </div>
                        <div className="grid-row">
                            <div className="grid-col">User Email:</div>
                            <div className="grid-col">{user?.email}</div>
                        </div>
                        <div className="grid-row display-flex flex-align-center">
                            <div className="grid-col flex-3">Division:</div>
                            <div className="grid-col flex-3">
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
                            <div className="grid-col flex-3">Role(s):</div>
                            <div className="grid-col flex-3">
                                {!isEditable && <span>{selectedRoles?.map((role) => role.name).join(", ")}</span>}
                                {isEditable && (
                                    <div data-testid="roles-combobox">
                                        <ComboBox
                                            namespace="roles-combobox"
                                            data={roles}
                                            selectedData={selectedRoles}
                                            setSelectedData={setSelectedRoles}
                                            defaultString="-- Select Roles --"
                                            optionText={(role) => role.name}
                                            isMulti={true}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid-row display-flex flex-align-center">
                            <div className="grid-col flex-3">Status:</div>
                            <div className="grid-col flex-3">
                                {!isEditable && <span>{selectedStatus?.name}</span>}
                                {isEditable && (
                                    <div data-testid="status-combobox">
                                        <ComboBox
                                            namespace="status-combobox"
                                            data={statusData}
                                            selectedData={selectedStatus}
                                            setSelectedData={setSelectedStatus}
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
