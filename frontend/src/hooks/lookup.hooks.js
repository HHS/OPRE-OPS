import React from "react";
import {
    useGetCansQuery,
    useGetProcurementShopsQuery,
    useGetProductServiceCodesQuery,
    useGetResearchProjectsQuery,
    useGetAgreementByIdQuery
} from "../api/opsAPI";

/**
 * This hook returns the display name given the id.
 * @param {number} id - The id.
 * @returns {string} - The display name of the related object.
 * @example
 * const displayName = useGetDisplayNameForProductServiceCodeId(1);
 */
export const useGetNameForProductServiceCodeId = (id) => {
    const [displayName, setDisplayName] = React.useState("unknown");

    const { data, isSuccess } = useGetProductServiceCodesQuery();

    React.useEffect(() => {
        if (isSuccess) {
            const item = data.find((element) => element.id === id);
            if (item) setDisplayName(`${item.display_name}`);
        }
    }, [id, data, isSuccess]);

    return displayName;
};

export const useGetNameForProcurementShopId = (id) => {
    const [displayName, setDisplayName] = React.useState("unknown");

    const { data, isSuccess } = useGetProcurementShopsQuery();

    React.useEffect(() => {
        if (isSuccess) {
            const item = data.find((element) => element.id === id);
            if (item) setDisplayName(`${item.display_name}`);
        }
    }, [id, data, isSuccess]);

    return displayName;
};

export const useGetNameForResearchProjectId = (id) => {
    const [displayName, setDisplayName] = React.useState("unknown");

    const { data, isSuccess } = useGetResearchProjectsQuery();

    React.useEffect(() => {
        if (isSuccess) {
            const item = data.find((element) => element.id === id);
            if (item) setDisplayName(`${item.display_name}`);
        }
    }, [id, data, isSuccess]);

    return displayName;
};

export const useGetNameForCanId = (id) => {
    const [displayName, setDisplayName] = React.useState("unknown");

    const { data, isSuccess } = useGetCansQuery();

    React.useEffect(() => {
        if (isSuccess) {
            const item = data.find((element) => element.id === id);
            if (item) setDisplayName(`${item.display_name}`);
        }
    }, [id, data, isSuccess]);

    return displayName;
};

/**
 * This hook returns the display name of an Agreement given the id.
 * @param {number} id - The id.
 * @returns {string} - The display name of the Agreement.
 */
export const useGetAgreementName = (id) => {
    const [displayName, setDisplayName] = React.useState("TBD");
    const { data, isSuccess } = useGetAgreementByIdQuery(id);

    React.useEffect(() => {
        if (isSuccess) {
            setDisplayName(data?.display_name);
        }
    }, [id, data, isSuccess]);

    return displayName;
};
