import React from "react";
import { useSelector } from "react-redux";
import { useGetUserByIdQuery } from "../api/opsAPI";
import { NO_DATA } from "../constants";

/**
 * This hook returns the display name of a user given their id.
 * It prefers the formatted `display_name` (derived at the API boundary) over `full_name`.
 * @param {number} id - The id of the user.
 * @returns {string} - The display name of the user.
 * @example
 * const userDisplayName = useGetUserFullNameFromId(1);
 */
const useGetUserFullNameFromId = (id) => {
    const [userFullName, setUserFullName] = React.useState(NO_DATA);
    const { data, isSuccess } = useGetUserByIdQuery(id, { skip: !id });

    React.useEffect(() => {
        if (isSuccess) {
            setUserFullName(`${data?.display_name ?? data?.full_name}`);
        }
    }, [data, isSuccess]);

    return userFullName;
};

export const useGetLoggedInUserFullName = () => {
    const loggedInUserDisplayName = useSelector((state) => state.auth?.activeUser?.display_name);
    const loggedInUserFullName = useSelector((state) => state.auth?.activeUser?.full_name);
    const loggedInUserFirstName = useSelector((state) => state.auth?.activeUser?.first_name);
    const loggedInUserEmail = useSelector((state) => state.auth?.activeUser?.email);

    return loggedInUserDisplayName ?? loggedInUserFullName ?? loggedInUserFirstName ?? loggedInUserEmail ?? "TBD";
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

export default useGetUserFullNameFromId;
