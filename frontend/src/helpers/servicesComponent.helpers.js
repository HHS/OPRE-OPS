const findServicesComponentById = (servicesComponents, id) => {
    if (!servicesComponents) return;
    return servicesComponents.find((component) => component.id === id);
};
export const findPeriodStart = (servicesComponents, servicesComponentId) => {
    const servicesComponent = findServicesComponentById(servicesComponents, servicesComponentId);
    return servicesComponent?.period_start;
};

export const findPeriodEnd = (servicesComponents, servicesComponentId) => {
    const servicesComponent = findServicesComponentById(servicesComponents, servicesComponentId);
    return servicesComponent?.period_end;
};

export const findDescription = (servicesComponents, servicesComponentId) => {
    const servicesComponent = findServicesComponentById(servicesComponents, servicesComponentId);
    return servicesComponent?.description;
};
