import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_DOMAIN = process.env.REACT_APP_BACKEND_DOMAIN;

export const agreementApi = createApi({
    reducerPath: "agreementApi",
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
        }),
    }),
});

export const { useGetAgreementsQuery } = agreementApi;
