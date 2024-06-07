import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "../components/Auth/auth";

// const BACKEND_DOMAIN = import.meta.env.VITE_BACKEND_DOMAIN;
// Adding optional runtime config.
const BACKEND_DOMAIN = window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN || import.meta.env.VITE_BACKEND_DOMAIN;

export const opsApi = createApi({
    reducerPath: "opsApi",
    tagTypes: [
        "Agreements",
        "ResearchProjects",
        "Users",
        "AgreementTypes",
        "AgreementReasons",
        "ProcurementShops",
        "BudgetLineItems",
        "AgreementHistory",
        "Portfolios",
        "CanFunding",
        "Notifications",
        "WorkflowStepInstance",
        "ServicesComponents",
        "ChangeRequests"
    ],
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_DOMAIN}/api/v1/`,
        prepareHeaders: (headers) => {
            const access_token = getAccessToken();

            if (access_token) {
                headers.set("Authorization", `Bearer ${access_token}`);
            }
            // Include this line to enable credentials (cookies)
            headers.set("withCredentials", "true");

            return headers;
        }
    }),
    endpoints: (builder) => ({
        getAgreements: builder.query({
            query: () => `/agreements/`,
            providesTags: ["Agreements", "BudgetLineItems"]
        }),
        getAgreementById: builder.query({
            query: (id) => `/agreements/${id}`,
            providesTags: ["Agreements"]
        }),
        addAgreement: builder.mutation({
            query: (data) => {
                return {
                    url: `/agreements/`,
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: data
                };
            },
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory"]
        }),
        updateAgreement: builder.mutation({
            query: ({ id, data }) => {
                return {
                    url: `/agreements/${id}`,
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: data
                };
            },
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory", "ServicesComponents"]
        }),
        deleteAgreement: builder.mutation({
            query: (id) => ({
                url: `/agreements/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory", "ServicesComponents"]
        }),
        getBudgetLineItems: builder.query({
            query: () => `/budget-line-items/`,
            providesTags: ["BudgetLineItems"]
        }),
        addBudgetLineItem: builder.mutation({
            query: (data) => {
                return {
                    url: `/budget-line-items/`,
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: data
                };
            },
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory"]
        }),
        updateBudgetLineItem: builder.mutation({
            query: ({ id, data }) => {
                return {
                    url: `/budget-line-items/${id}`,
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: data
                };
            },
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory"]
        }),
        deleteBudgetLineItem: builder.mutation({
            query: (id) => ({
                url: `/budget-line-items/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory"]
        }),
        getAgreementsByResearchProjectFilter: builder.query({
            query: (id) => `/agreements/?project_id=${id}`,
            providesTags: ["Agreements", "FilterAgreements"]
        }),
        getUserById: builder.query({
            query: (id) => `/users/${id}`,
            providesTags: ["Users"]
        }),
        getUserByOIDCId: builder.query({
            query: (id) => `/users/?oidc_id=${id}`,
            providesTags: ["Users"]
        }),
        getResearchProjects: builder.query({
            query: () => `/research-projects/`,
            providesTags: ["ResearchProjects"]
        }),
        addResearchProjects: builder.mutation({
            query: (body) => ({
                url: `/research-projects/`,
                method: "POST",
                body
            }),
            invalidatesTags: ["ResearchProjects"]
        }),
        updateBudgetLineItemStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/budget-line-items/${id}`,
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: { status }
            }),
            invalidatesTags: ["Agreements", "BudgetLineItems"]
        }),
        getAgreementTypes: builder.query({
            query: () => `/agreement-types/`,
            providesTags: ["AgreementTypes"]
        }),
        getProductServiceCodes: builder.query({
            query: () => `/product-service-codes/`,
            providesTags: ["ProductServiceCodes"]
        }),
        getProcurementShops: builder.query({
            query: () => `/procurement-shops/`,
            providesTags: ["ProcurementShops"]
        }),
        getAgreementReasons: builder.query({
            query: () => `/agreement-reasons/`,
            providesTags: ["AgreementReasons"]
        }),
        getUsers: builder.query({
            query: () => `/users/`,
            providesTags: ["Users"]
        }),
        getUser: builder.query({
            query: (id) => `/users/${id}`,
            providesTags: ["User"]
        }),
        getUserByOidc: builder.query({
            query: (oidc_id) => `/users/?oidc_id=${oidc_id}`,
            providesTags: ["User"]
        }),
        addUser: builder.mutation({
            query: (body) => ({
                url: `/users/`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body
            }),
            invalidatesTags: ["User"]
        }),
        updateUser: builder.mutation({
            query: ({ id, body }) => ({
                url: `/users/${id}`,
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body
            }),
            invalidatesTags: ["User"]
        }),
        getCans: builder.query({
            query: () => `/cans/`,
            providesTags: ["Cans"]
        }),
        getCanFundingSummary: builder.query({
            query: (id) => `/can-funding-summary/${id}`,
            providesTags: ["CanFunding"]
        }),
        getNotificationsByUserId: builder.query({
            query: ({ id, auth_header }) => {
                if (!id) {
                    return { skip: true }; // Skip the query if id is undefined
                }
                return {
                    url: `/notifications/?oidc_id=${id}`,
                    headers: { Authorization: auth_header }
                };
            },
            providesTags: ["Notifications"]
        }),
        dismissNotification: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: { is_read: true }
            }),
            invalidatesTags: ["Notifications"]
        }),
        getPortfolios: builder.query({
            query: () => `/portfolios/`,
            providesTags: ["Portfolios"]
        }),
        addBliPackage: builder.mutation({
            query: (body) => ({
                url: `/bli-packages/`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body
            }),
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory", "Packages", "BliPackages"]
        }),
        addApprovalRequest: builder.mutation({
            query: (body) => ({
                url: `/workflow-submit/`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body
            }),
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory", "Packages", "BliPackages"]
        }),
        addWorkflowApprove: builder.mutation({
            query: (body) => ({
                url: `/workflow-approve/`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body
            }),
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory", "Packages", "BliPackages"]
        }),
        getWorkflowInstance: builder.query({
            query: (id) => `/workflow-instance/${id}`,
            providesTags: ["WorkflowInstance"]
        }),
        getWorkflowStepInstance: builder.query({
            query: (id) => `/workflow-step-instance/${id}`,
            providesTags: ["WorkflowStepInstance"]
        }),
        getAzureSasToken: builder.query({
            query: () => `/azure/sas-token`
        }),
        addServicesComponent: builder.mutation({
            query: (data) => {
                return {
                    url: `/services-components/`,
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: data
                };
            },
            invalidatesTags: ["ServicesComponents", "Agreements", "BudgetLineItems", "AgreementHistory"]
        }),
        updateServicesComponent: builder.mutation({
            query: ({ id, data }) => {
                return {
                    url: `/services-components/${id}`,
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: data
                };
            },
            invalidatesTags: ["ServicesComponents", "Agreements", "BudgetLineItems", "AgreementHistory"]
        }),
        getServicesComponentById: builder.query({
            query: (id) => `/services-components/${id}`,
            providesTags: ["ServicesComponents"]
        }),
        getServicesComponentsList: builder.query({
            query: (agreementId) => `/services-components/?contract_agreement_id=${agreementId}`,
            providesTags: ["ServicesComponents"]
        }),
        deleteServicesComponent: builder.mutation({
            query: (id) => ({
                url: `/services-components/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["ServicesComponents", "Agreements", "BudgetLineItems", "AgreementHistory"]
        }),
        getChangeRequestsList: builder.query({
            query: () => `/change-requests/`,
            providesTags: ["ChangeRequests"]
        })
    })
});

export const {
    useGetAgreementsQuery,
    useGetAgreementByIdQuery,
    useAddAgreementMutation,
    useUpdateAgreementMutation,
    useDeleteAgreementMutation,
    useAddBudgetLineItemMutation,
    useGetBudgetLineItemsQuery,
    useUpdateBudgetLineItemMutation,
    useDeleteBudgetLineItemMutation,
    useGetAgreementsByResearchProjectFilterQuery,
    useGetUserByIdQuery,
    useGetUserByOIDCIdQuery,
    useGetResearchProjectsQuery,
    useAddResearchProjectsMutation,
    useUpdateBudgetLineItemStatusMutation,
    useGetAgreementTypesQuery,
    useGetProductServiceCodesQuery,
    useGetProcurementShopsQuery,
    useGetAgreementReasonsQuery,
    useGetUsersQuery,
    useGetUserQuery,
    useGetUserByOidcQuery,
    useAddUserMutation,
    useUpdateUserMutation,
    useGetCansQuery,
    useGetCanFundingSummaryQuery,
    useGetNotificationsByUserIdQuery,
    useDismissNotificationMutation,
    useGetPortfoliosQuery,
    useAddBliPackageMutation,
    useAddApprovalRequestMutation,
    useAddWorkflowApproveMutation,
    useGetWorkflowInstanceQuery,
    useGetWorkflowStepInstanceQuery,
    useGetAzureSasTokenQuery,
    useAddServicesComponentMutation,
    useUpdateServicesComponentMutation,
    useGetServicesComponentByIdQuery,
    useGetServicesComponentsListQuery,
    useDeleteServicesComponentMutation,
    useGetChangeRequestsListQuery
} = opsApi;
