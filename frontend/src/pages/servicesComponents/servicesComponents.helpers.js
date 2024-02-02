export const addOInFront = (str) => {
    return "O" + str;
};

export function formatServiceComponent(servicesComponent, optional, serviceReqType) {
    if (serviceReqType === "Non-Severable") {
        return `${optional ? "Optional" : ""} Services Component ${servicesComponent}`;
    }
}

export const dateToYearMonthDay = (date) => {
    if (date) {
        const [year, month, day] = date.split("-").map((d) => parseInt(d, 10));
        return { year, month, day };
    } else {
        return { year: "", month: "", day: "" };
    }
};
