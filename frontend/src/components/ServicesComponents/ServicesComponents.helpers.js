import { SERVICE_REQ_TYPES, SEVERABLE_OPTIONS } from "./ServicesComponents.constants";

/**
 * Formats the service component string based on the provided parameters.
 *
 * @param {number} number - The service component number.
 * @param {boolean} optional - Indicates if the service component is optional.
 * @param { 'NON_SEVERABLE' | 'SEVERABLE'} serviceReqType - The type of service requirement (e.g., 'SEVERABLE' or 'NON_SEVERABLE').
 * @param {boolean} [abbr=false] - Whether to use an abbreviated format.
 * @param {string} [serviceComponentGroupingLabel] - serviceComponentGroupingLabel of the services component.
 * @returns {string | undefined} The formatted service component string.
 */
export function formatServiceComponent(
    number,
    optional,
    serviceReqType,
    abbr = false,
    serviceComponentGroupingLabel = ""
) {
    if (serviceReqType === SERVICE_REQ_TYPES.NON_SEVERABLE) {
        if (optional) {
            return `${abbr ? "OSC" : "Optional Services Component "}${serviceComponentGroupingLabel ? serviceComponentGroupingLabel : number}`;
        }
        return `${abbr ? "SC" : "Services Component "}${serviceComponentGroupingLabel ? serviceComponentGroupingLabel : number}`;
    }
    if (serviceReqType === SERVICE_REQ_TYPES.SEVERABLE) {
        return `${SEVERABLE_OPTIONS[number - 1]?.label}`;
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

const SERVICES_COMPONENT_PENDING_TITLE =
    "This services component has pending edits that will require a contract modification:";

/**
 * Describe a Services Component add change request (OPS-6440) as display lines, without bullets:
 * "Adding: SC3 BL 15012, BL 15013". Read from the request's frozen diff, so it works after the SC
 * itself is gone.
 *
 * @param {import("../../types/ChangeRequestsTypes").ChangeRequest} changeRequest
 * @returns {string[]}
 */
export function getServicesComponentChangeLines(changeRequest) {
    const diff = changeRequest?.requested_change_diff ?? {};
    const budgetLines = (changeRequest?.requested_change_info?.linked_budget_line_item_ids ?? []).map(
        (id) => `BL ${id}`
    );
    if (diff.services_component_create) {
        const name = diff.services_component_create.new;
        return [[`Adding: ${name}`, budgetLines.join(", ")].filter(Boolean).join(" ")];
    }
    return [];
}

/**
 * "Changes In Review" banner entries for an agreement's Services Component additions in review
 * (OPS-6440), e.g. "SC3 Addition".
 *
 * @param {Array<any>} changeRequests - The agreement's change_requests_in_review.
 * @returns {string[]}
 */
export const getServicesComponentChangeMessages = (changeRequests) =>
    (changeRequests ?? [])
        .filter((changeRequest) => changeRequest?.has_services_component_change)
        .map(
            (changeRequest) =>
                `${changeRequest.requested_change_info?.target_display_name ?? "Services Component"} Addition`
        );

/**
 * Tooltip for a services component whose addition is in review (OPS-6440), in the same
 * format as a budget line's pending-edits tooltip.
 *
 * @param {object} servicesComponent - A services component as returned by the API.
 * @returns {string} The locked-icon tooltip, or "" when nothing is in review.
 */
export function getServicesComponentLockedMessage(servicesComponent) {
    if (!servicesComponent?.in_review) return "";
    return (servicesComponent.change_requests_in_review ?? [])
        .flatMap(getServicesComponentChangeLines)
        .reduce((message, line) => `${message}\n \u2022 ${line}`, SERVICES_COMPONENT_PENDING_TITLE);
}
