import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {getAccessToken} from "../components/Auth/auth";
import {logout, setLoginError} from "../components/Auth/authSlice";

const BACKEND_DOMAIN =
    (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN) ||
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
            query: ({provider, code}) => ({
                url: "/login/",
                method: "POST",
                body: {provider, code}
            }),
            invalidatesTags: ["Auth"],
            async onQueryStarted(_, {dispatch, queryFulfilled}) {
                try {
                    await queryFulfilled;
                    dispatch(setLoginError({hasError: false, loginErrorType: null}));
                } catch (err) {
                    dispatch(setLoginError({
                        hasError: true,
                        loginErrorType: err.error?.data?.error_type || "UNKNOWN_ERROR"
                    }));
                }
            }
        }),
        logout: builder.mutation({
            query: () => ({
                url: "/logout/",
                method: "POST"
            }),
            async onQueryStarted(_, {dispatch, queryFulfilled}) {
                try {
                    await queryFulfilled;
                    // Dispatch logout action to clear auth state
                    dispatch(logout());
                } catch (err) {
                    console.error("Error during logout:", err);
                }
            }
        }),
        getUserProfile: builder.query({
            query: () => "/profile/",
            providesTags: ["Auth"]
        })
    })
});

export const {useGetRolesQuery, useLoginMutation, useLogoutMutation} = opsAuthApi;
