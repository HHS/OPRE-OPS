import React from "react";
import { useGetServicesComponentByIdQuery } from "../api/opsAPI";


const servicesComponentsDisplayNameObj = {};
/**
 * This hook returns the short code of a services component given its id.
 * @param {number} id - The id of the services component.
 * @returns {string} - The short code of the services component.
 *
 * @example
 * const servicesComponentDisplayName = useGetServicesComponentDisplayName(1);
 */
export const useGetServicesComponentDisplayName = (id) => {
    const [servicesComponentDisplayName, setServicesComponentDisplayName] = React.useState("TBD");
    const { data, isSuccess } = useGetServicesComponentByIdQuery(id);

    React.useEffect(() => {
        if (isSuccess) {
            setServicesComponentDisplayName(`${data?.display_name}`);
            // @ts-ignore
            servicesComponentsDisplayNameObj[id] = data?.display_name;

        }
    }, [data, isSuccess]);

    return servicesComponentDisplayName;
};

export const useGetServicesComponentDisplayNameLocal = (id) => {
    if(id in servicesComponentsDisplayNameObj){
        // @ts-ignore
        return servicesComponentsDisplayNameObj[id];
    }
    return "";
}

/**
 * This hook returns the long title of a services component given its id.
 * @param {number} id - The id of the services component.
 * @returns {string} - The long form title of the services component.
 *
 * @example
 * const servicesComponentDisplayTitle = useGetServicesComponentDisplayTitle(1);
 */
export const useGetServicesComponentDisplayTitle = (id) => {
    const [servicesComponentDisplayTitle, setServicesComponentDisplayTitle] = React.useState("TBD");
    const { data, isSuccess } = useGetServicesComponentByIdQuery(id);

    React.useEffect(() => {
        if (isSuccess) {
            setServicesComponentDisplayTitle(`${data?.display_title}`);
        }
    }, [data, isSuccess]);

    return servicesComponentDisplayTitle;
};
