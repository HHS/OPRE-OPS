import styles from "./UserInfo.module.css";
import { useGetDivisionsQuery } from "../../../api/opsAPI.js";
import ComboBox from "../../UI/Form/ComboBox/index.js";
import React, { useEffect } from "react";
import { useGetRolesQuery } from "../../../api/opsAuthAPI.js";

const UserInfo = ({ user }) => {
    // const wasInit = useRef(false);
    const [selectedDivision, setSelectedDivision] = React.useState({});
    const [selectedStatus, setSelectedStatus] = React.useState({});
    const [selectedRoles, setSelectedRoles] = React.useState([]);
    const statusData = [
        { id: 1, name: "ACTIVE" },
        { id: 2, name: "INACTIVE" },
        { id: 3, name: "LOCKED" }
    ];

    const { data: divisions, error: errorDivisions, isLoading: isLoadingDivisions } = useGetDivisionsQuery();
    const { data: roles, error: errorRoles, isLoading: isLoadingRoles } = useGetRolesQuery();

    useEffect(() => {
        setSelectedDivision(divisions?.find((division) => division.id === user.division));
        setSelectedStatus(statusData.find((status) => status.name === user.status));
        setSelectedRoles(roles?.filter((role) => user.roles.includes(role.name)));

        return () => {
            setSelectedDivision([]);
            setSelectedStatus([]);
            setSelectedRoles([]);
        };
    }, [divisions, roles]);

    if (isLoadingDivisions || isLoadingRoles) {
        return <div>Loading...</div>;
    }
    if (errorDivisions || errorRoles) {
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
                        <div className={`grid-row ${styles.centeredItem}`}>
                            <div className="grid-col flex-3">Division:</div>
                            <div className="grid-col flex-3">
                                <ComboBox
                                    namespace="division-combobox"
                                    data={divisions}
                                    selectedData={selectedDivision}
                                    setSelectedData={setSelectedDivision}
                                    defaultString="-- Select Division --"
                                    optionText={(division) => division.name}
                                    isMulti={false}
                                />
                            </div>
                        </div>
                        <div className="grid-row">
                            <div className="grid-col flex-3">Role(s):</div>
                            <div className="grid-col flex-3">
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
                        </div>
                        <div className={`grid-row ${styles.centeredItem}`}>
                            <div className="grid-col flex-3">Status:</div>
                            {/*<span className={styles.column}>{user?.status}</span>*/}
                            <div className="grid-col flex-3">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfo;
