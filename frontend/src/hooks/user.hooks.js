import React from "react";
import { useSelector } from "react-redux";
import { useGetUserByIdQuery } from "../api/opsAPI";

/**
 * This hook returns the full name of a user given their id.
 * @param {number} id - The id of the user.
 * @returns {string} - The full name of the user.
 * @example
 * const userFullName = useGetUserFullNameFromId(1);
 */
const useGetUserFullNameFromId = (id) => {
    const [userFullName, setUserFullName] = React.useState("unknown");
    const { data, isSuccess } = useGetUserByIdQuery(id);

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
 * This hook checks if the logged-in user has a specific role.
 * @param {string} role - The role to check for.
 * @returns {boolean} - True if the user has the role, false otherwise.
 * @example
 * const isAdmin = useIsUserOfRoleType('admin'); // returns true if the user is an admin
 */
export const useIsUserOfRoleType = (role) => {
    const loggedInUserRoles = useSelector((state) => state.auth?.activeUser?.roles) ?? [];
    return loggedInUserRoles.some((r) => r?.name === role);
};

export default useGetUserFullNameFromId;
