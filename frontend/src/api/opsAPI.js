import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_DOMAIN = process.env.REACT_APP_BACKEND_DOMAIN;

export const opsApi = createApi({
    reducerPath: "opsApi",
    tagTypes: ["Agreements", "ResearchProjects", "Users", "AgreementTypes", "AgreementReasons", "ProcurementShops"],
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_DOMAIN}/api/v1/`,
        prepareHeaders: (headers) => {
            const access_token = localStorage.getItem("access_token");

            if (access_token) {
                headers.set("Authorization", `Bearer ${access_token}`);
            }

            return headers;
        },
    }),
    endpoints: (builder) => ({
        getAgreements: builder.query({
            query: () => `/agreements/`,
            providesTags: ["Agreements"],
        }),
        getAgreementById: builder.query({
            query: (id) => `/agreements/${id}`,
            providesTags: ["Agreements"],
        }),
        addAgreement: builder.mutation({
            query: (data) => {
                // remove fields that are not allowed
                // eslint-disable-next-line no-unused-vars
                const { id, budget_line_items, created_by, created_on, updated_on, ...postData } = data;
                return {
                    url: `/agreements/`,
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: { ...postData, number: "" },
                };
            },
            invalidatesTags: ["Agreements", "BudgetLineItems"],
        }),
        updateAgreement: builder.mutation({
            query: ({ id, data }) => {
                // remove fields that are not allowed
                // eslint-disable-next-line no-unused-vars
                const { id: _id, budget_line_items, created_by, created_on, updated_on, ...patchData } = data;
                return {
                    url: `/agreements/${id}`,
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: patchData,
                };
            },
            invalidatesTags: ["Agreements", "BudgetLineItems"],
        }),
        addBudgetLineItem: builder.mutation({
            query: ({ data }) => {
                const cleanData = { ...data }; // make a copy
                if (cleanData.date_needed === "--") {
                    cleanData.date_needed = null;
                }
                delete cleanData.created_by;
                delete cleanData.can;
                delete cleanData.id;

                return {
                    url: `/budget-line-items/`,
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: cleanData,
                };
            },
            invalidatesTags: ["Agreements", "BudgetLineItems"],
        }),
        updateBudgetLineItem: builder.mutation({
            query: ({ data }) => {
                const cleanData = { ...data }; // make a copy
                if (cleanData.date_needed === "--") {
                    cleanData.date_needed = null;
                }
                const budgetLineId = cleanData.id;
                delete cleanData.created_by;
                delete cleanData.created_on;
                delete cleanData.updated_on;
                delete cleanData.can;
                delete cleanData.id;

                return {
                    url: `/budget-line-items/${budgetLineId}`,
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: cleanData,
                };
            },
            invalidatesTags: ["Agreements", "BudgetLineItems"],
        }),
        getAgreementsByResearchProjectFilter: builder.query({
            query: (id) => `/agreements/?research_project_id=${id}`,
            providesTags: ["Agreements", "FilterAgreements"],
        }),
        getUserById: builder.query({
            query: (id) => `/users/${id}`,
            providesTags: ["Users"],
        }),
        getUserByOIDCId: builder.query({
            query: (id) => `/users/?oidc_id=${id}`,
            providesTags: ["Users"],
        }),
        getResearchProjects: builder.query({
            query: () => `/research-projects/`,
            providesTags: ["ResearchProjects"],
        }),
        addResearchProjects: builder.mutation({
            query: (body) => ({
                url: `/research-projects/`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["ResearchProjects"],
        }),
        updateBudgetLineItemStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/budget-line-items/${id}`,
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: { status },
            }),
            invalidatesTags: ["Agreements", "BudgetLineItems"],
        }),
        getAgreementTypes: builder.query({
            query: () => `/agreement-types/`,
            providesTags: ["AgreementTypes"],
        }),
        getProductServiceCodes: builder.query({
            query: () => `/product-service-codes/`,
            providesTags: ["ProductServiceCodes"],
        }),
        getProcurementShops: builder.query({
            query: () => `/procurement-shops/`,
            providesTags: ["ProcurementShops"],
        }),
        getAgreementReasons: builder.query({
            query: () => `/agreement-reasons/`,
            providesTags: ["AgreementReasons"],
        }),
        getUsers: builder.query({
            query: () => `/users/`,
            providesTags: ["Users"],
        }),
        getUser: builder.query({
            query: (id) => `/users/${id}`,
            providesTags: ["User"],
        }),
        getUserByOidc: builder.query({
            query: (oidc_id) => `/users/?oidc_id=${oidc_id}`,
            providesTags: ["User"],
        }),
        addUser: builder.mutation({
            query: (body) => ({
                url: `/users/`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
            }),
            invalidatesTags: ["User"],
        }),
        updateUser: builder.mutation({
            query: ({ id, body }) => ({
                url: `/users/${id}`,
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body,
            }),
            invalidatesTags: ["User"],
        }),
        getCans: builder.query({
            query: () => `/cans/`,
            providesTags: ["Cans"],
        }),
        getNotificationsByUserId: builder.query({
            query: (id) => `/notifications/?oidc_id=${id}`,
            providesTags: ["Notifications"],
        }),
        dismissNotification: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: { is_read: true },
            }),
            invalidatesTags: ["Notifications"],
        }),
    }),
});

export const {
    useGetAgreementsQuery,
    useGetAgreementByIdQuery,
    useAddAgreementMutation,
    useUpdateAgreementMutation,
    useAddBudgetLineItemMutation,
    useUpdateBudgetLineItemMutation,
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
    useGetNotificationsByUserIdQuery,
    useDismissNotificationMutation,
} = opsApi;
