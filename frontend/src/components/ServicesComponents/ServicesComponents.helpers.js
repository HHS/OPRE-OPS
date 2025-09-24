import { SERVICE_REQ_TYPES, SEVERABLE_OPTIONS } from "./ServicesComponents.constants";

/**
 * Formats the service component string based on the provided parameters.
 *
 * @param {number} number - The service component number.
 * @param {boolean} optional - Indicates if the service component is optional.
 * @param { 'NON_SEVERABLE' | 'SEVERABLE'} serviceReqType - The type of service requirement (e.g., 'SEVERABLE' or 'NON_SEVERABLE').
 * @param {boolean} [abbr=false] - Whether to use an abbreviated format.
 * @returns {string | undefined} The formatted service component string.
 */
export function formatServiceComponent(number, optional, serviceReqType, abbr = false) {
    if (serviceReqType === SERVICE_REQ_TYPES.NON_SEVERABLE) {
        return `${optional ? "Optional" : ""} ${abbr ? "SC" : "Services Components"} ${number}`;
    }
    if (serviceReqType === SERVICE_REQ_TYPES.SEVERABLE) {
        return `${SEVERABLE_OPTIONS[number - 1]}`;
    }

    console.error("Invalid serviceReqType");
}

export const dateToYearMonthDay = (date) => {
    if (date) {
        const [year, month, day] = date.split("-").map((d) => parseInt(d, 10));
        return { year, month, day };
    } else {
        return { year: "", month: "", day: "" };
    }
};
