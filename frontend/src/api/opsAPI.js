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
        getAgreementTypes: builder.query({
            query: () => `/agreement-types/`,
            providesTags: ["AgreementTypes"],
        }),
        getProductServiceCodes: builder.query({
            query: () => `/product-service-codes/`,
            providesTags: ["ProductServiceCodes"],
        }),
    }),
});

export const {
    useGetAgreementsQuery,
    useGetAgreementByIdQuery,
    useGetResearchProjectsQuery,
    useAddResearchProjectsMutation,
    useGetAgreementTypesQuery,
    useGetProductServiceCodesQuery,
} = opsApi;
