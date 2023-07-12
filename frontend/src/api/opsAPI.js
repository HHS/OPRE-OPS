import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_DOMAIN = process.env.REACT_APP_BACKEND_DOMAIN;

export const opsApi = createApi({
    reducerPath: "opsApi",
    tagTypes: ["Agreements", "ResearchProjects"],
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_DOMAIN}/api/v1/`,
        prepareHeaders: (headers, { getState }) => {
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
        getCans: builder.query({
            query: () => `/cans/`,
            providesTags: ["Cans"],
        }),
        getNotificationsByUserId: builder.query({
            query: (id) => `/notifications/?oidc_id=${id}`,
            providesTags: ["Notifications"],
        }),
    }),
});

export const {
    useGetAgreementsQuery,
    useGetAgreementByIdQuery,
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
    useGetCansQuery,
    useGetNotificationsByUserIdQuery,
} = opsApi;
