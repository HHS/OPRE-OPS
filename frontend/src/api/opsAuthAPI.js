import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "../components/Auth/auth";
import { logout } from "../components/Auth/authSlice";

const BACKEND_DOMAIN =
    window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN ||
    import.meta.env.VITE_BACKEND_DOMAIN ||
    "https://localhost:8000"; // Default to localhost if not provided (e.g. in tests)

export const opsAuthApi = createApi({
    reducerPath: "opsAuthApi",
    tagTypes: ["Roles", "Auth"],
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
        }),
        login: builder.mutation({
            query: ({ provider, code }) => ({
                url: "/login/",
                method: "POST",
                body: { provider, code }
            }),
            invalidatesTags: ["Auth"]
        }),
        logout: builder.mutation({
            query: () => ({
                url: "/logout/",
                method: "POST"
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    // Dispatch logout action to clear auth state
                    dispatch(logout());
                } catch (err) {
                    console.error("Error during logout:", err);
                }
            }
        }),
        refreshToken: builder.mutation({
            query: () => ({
                url: "/refresh/",
                method: "POST"
            }),
            invalidatesTags: ["Auth"]
        }),
        getUserProfile: builder.query({
            query: () => "/profile/",
            providesTags: ["Auth"]
        })
    })
});

export const {
    useGetRolesQuery,
    useLoginMutation,
    useLogoutMutation,
    useRefreshTokenMutation,
    useGetUserProfileQuery
} = opsAuthApi;
