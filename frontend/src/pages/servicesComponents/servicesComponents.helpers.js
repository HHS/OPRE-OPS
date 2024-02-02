import { nonSeverableOptions } from "./servicesComponents.constants";

export const addOptionalInFront = (str) => {
    return "Optional " + str;
};

export const addOInFront = (str) => {
    return "O" + str;
};

export function formatServiceComponent(input) {
    const index = nonSeverableOptions.indexOf(input);
    if (index !== -1) {
        return `Services Component ${index + 1}`;
    }
    return null;
}

export const dateToYearMonthDay = (date) => {
    if (date) {
        const [year, month, day] = date.split("-").map((d) => parseInt(d, 10));
        return { year, month, day };
    } else {
        return { year: "", month: "", day: "" };
    }
};
