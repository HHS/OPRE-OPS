import React from "react";
import { useSelector } from "react-redux";
import { useGetUserByIdQuery } from "../api/opsAPI";
import { NO_DATA } from "../constants";
import { USER_ROLES } from "../components/Users/User.constants";

/**
 * This hook returns the full name of a user given their id.
 * @param {number} id - The id of the user.
 * @returns {string} - The full name of the user.
 * @example
 * const userFullName = useGetUserFullNameFromId(1);
 */
const useGetUserFullNameFromId = (id) => {
    const [userFullName, setUserFullName] = React.useState(NO_DATA);
    const { data, isSuccess } = useGetUserByIdQuery(id, { skip: !id });

    React.useEffect(() => {
        if (isSuccess) {
            setUserFullName(`${data?.full_name}`);
        }
    }, [data, isSuccess]);

    return userFullName;
};

export const useGetLoggedInUserFullName = () => {
    const loggedInUserFullName = useSelector((state) => state.auth?.activeUser?.full_name);
    const loggedInUserFirstName = useSelector((state) => state.auth?.activeUser?.first_name);
    const loggedInUserEmail = useSelector((state) => state.auth?.activeUser?.email);

    return loggedInUserFullName ?? loggedInUserFirstName ?? loggedInUserEmail ?? "TBD";
};

/**
 * This hook checks if the logged-in user is a super user.
 * @returns {boolean} - True if the user has the role, false otherwise.
 * @example
 * const isAdmin = useIsUserSuperUser('admin'); // returns true if the user is an admin
 */
export const useIsUserSuperUser = () => {
    return useSelector((state) => state.auth?.activeUser?.is_superuser) ?? false;
};

export const useIsUserOnlyProcurementTeam = () => {
    const roles = useSelector((state) => state.auth?.activeUser?.roles) ?? [];
    return roles.length === 1 && roles[0]?.name === USER_ROLES.PROCUREMENT_TEAM;
};

export default useGetUserFullNameFromId;
