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

/**
 * Find the service component number based on the services_component_id
 * This handles both existing service components (with backend IDs) and new ones (using numbers)
 * @param {number|null} servicesComponentId - The services component ID from the budget line
 * @param {import ("../types/ServicesComponents").ServicesComponents[]} servicesComponents - The list of all services components
 * @returns {number|null} - The service component number to use in the select
 */
export const findServiceComponentNumber = (servicesComponentId, servicesComponents) => {
    if (!servicesComponentId || !servicesComponents) {
        return null;
    }

    // First, try to find by ID (for existing service components from backend)
    const existingComponent = servicesComponents.find((sc) => sc.id === servicesComponentId);
    if (existingComponent) {
        return existingComponent.number;
    }

    // If not found by ID, try to find by number (for new service components)
    const componentByNumber = servicesComponents.find((sc) => sc.number === servicesComponentId);
    if (componentByNumber) {
        return componentByNumber.number;
    }

    // If still not found, assume the servicesComponentId is already a number
    // This handles the case where it's a new service component
    return servicesComponentId;
};
