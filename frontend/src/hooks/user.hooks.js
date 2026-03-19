import React from "react";
import { useSelector } from "react-redux";
import { useGetUserByIdQuery } from "../api/opsAPI";
import { NO_DATA } from "../constants";

/**
 * Returns the display name of a user given their id.
 * Prefers the formatted `display_name` (derived at the API boundary) over raw `full_name`.
 *
 * @param {number} id - The id of the user.
 * @returns {string} - The display name of the user.
 * @example
 * const name = useGetUserDisplayNameFromId(1);
 */
export const useGetUserDisplayNameFromId = (id) => {
    const [userDisplayName, setUserDisplayName] = React.useState(NO_DATA);
    const { data, isSuccess } = useGetUserByIdQuery(id, { skip: !id });

    React.useEffect(() => {
        if (isSuccess) {
            setUserDisplayName(`${data?.display_name ?? data?.full_name}`);
        }
    }, [data, isSuccess]);

    return userDisplayName;
};

/**
 * Backwards-compatible alias for useGetUserDisplayNameFromId.
 * @param {number} id
 * @returns {string}
 */
const useGetUserFullNameFromId = useGetUserDisplayNameFromId;

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
