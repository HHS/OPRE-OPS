const findServicesComponentByNumber = (servicesComponents, number) => {
    if (!servicesComponents) return;
    return servicesComponents.find((sc) => {
        const scGroupingLabel = sc.sub_component ? `${sc.number}-${sc.sub_component}` : `${sc.number}`;
        return scGroupingLabel === number;
    });
};
export const findPeriodStart = (servicesComponents, servicesComponentNumber) => {
    const servicesComponent = findServicesComponentByNumber(servicesComponents, servicesComponentNumber);
    return servicesComponent?.period_start;
};

export const findPeriodEnd = (servicesComponents, servicesComponentNumber) => {
    const servicesComponent = findServicesComponentByNumber(servicesComponents, servicesComponentNumber);
    return servicesComponent?.period_end;
};

export const findDescription = (servicesComponents, servicesComponentNumber) => {
    const servicesComponent = findServicesComponentByNumber(servicesComponents, servicesComponentNumber);
    return servicesComponent?.description;
};
export const findIfOptional = (servicesComponents, servicesComponentNumber) => {
    const servicesComponent = findServicesComponentByNumber(servicesComponents, servicesComponentNumber);
    return servicesComponent?.optional;
};
