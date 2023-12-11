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

export default useGetUserFullNameFromId;
