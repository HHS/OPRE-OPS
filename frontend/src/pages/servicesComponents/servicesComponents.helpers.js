import { SERVICE_REQ_TYPES, SEVERABLE_OPTIONS } from "./servicesComponents.constants";

export function formatServiceComponent(servicesComponent, optional, serviceReqType) {
    if (serviceReqType === SERVICE_REQ_TYPES.NON_SEVERABLE) {
        return `${optional ? "Optional" : ""} Services Component ${servicesComponent}`;
    }
    if (serviceReqType === SERVICE_REQ_TYPES.SEVERABLE) {
        return `${SEVERABLE_OPTIONS[servicesComponent - 1]}`;
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
