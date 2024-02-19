export const SERVICE_REQ_TYPES = {
    NON_SEVERABLE: "NON_SEVERABLE",
    SEVERABLE: "SEVERABLE"
};

export const NON_SEVERABLE_OPTIONS = ["SC1", "SC2", "SC3", "SC4", "SC5", "SC6"];

export const SEVERABLE_OPTIONS = [
    "Base Period 1",
    "Option Period 2",
    "Option Period 3",
    "Option Period 4",
    "Option Period 5",
    "Option Period 6"
];

export const backendServicesComponents = {
    agreementId: "1",
    serviceReqType: SERVICE_REQ_TYPES.NON_SEVERABLE,
    servicesComponents: [
        {
            id: "9ab46509-8a3c-498a-998d-b40e78df5cd3",
            servicesComponent: 1,
            optional: false,
            popStartDate: "2024-03-15",
            popEndDate: "2025-01-15",
            description:
                "Develop a theory of change and identify ways to improve the program through continuous user feedback and engagement"
        }
    ]
};

export const initialFormData = {
    number: "",
    optional: "",
    popStartMonth: "",
    popStartDay: "",
    popStartYear: "",
    popEndMonth: "",
    popEndDay: "",
    popEndYear: "",
    description: "",
    mode: "add"
};
