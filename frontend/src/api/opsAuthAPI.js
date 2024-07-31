import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "../components/Auth/auth";

const BACKEND_DOMAIN =
    window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN ||
    import.meta.env.VITE_BACKEND_DOMAIN ||
    "http://localhost:8000"; // Default to localhost if not provided (e.g. in tests)

export const opsAuthApi = createApi({
    reducerPath: "opsAuthApi",
    tagTypes: ["Roles"],
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_DOMAIN}/auth/`,
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
        getRoles: builder.query({
            query: () => `/roles/`,
            providesTags: ["Roles"]
        })
    })
});

export const { useGetRolesQuery } = opsAuthApi;
