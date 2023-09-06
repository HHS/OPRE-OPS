import React from "react";
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

export default useGetUserFullNameFromId;
