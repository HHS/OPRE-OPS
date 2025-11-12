const findServicesComponentByNumber = (servicesComponents, number) => {
    if (!servicesComponents) return;
    return servicesComponents.find((component) => component.number === number);
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
