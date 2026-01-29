import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "../components/Auth/auth";
import { postRefresh } from "./postRefresh.js";
import { logout } from "../components/Auth/authSlice.js";
import store from "../store";

const BACKEND_DOMAIN =
    (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN) ||
    import.meta.env.VITE_BACKEND_DOMAIN ||
    "https://localhost:8000"; // Default to localhost if not provided (e.g. in tests)

const getBaseQueryWithReauth = (baseQuery) => {
    return async function (args, api, extraOptions) {
        let result = await baseQuery(args, api, extraOptions);

        if (result.error && (result.error.status === 401 || result.error.data === "Unauthorized")) {
            const token = await postRefresh();

            if (token) {
                // Store the new token in local storage or wherever you keep it
                localStorage.setItem("access_token", token.access_token);
                result = await baseQuery(args, api, extraOptions);
            } else {
                store.dispatch(logout());
                window.location.href = "/login";
            }
        }
        return result;
    };
};

const baseQuery = fetchBaseQuery({
    baseUrl: `${BACKEND_DOMAIN}/api/v1/`,
    prepareHeaders: (headers) => {
        // this method should retrieve the token without a hook
        const token = getAccessToken();

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    }
});

const MAX_RESULTS_LIMIT = 50;

export const opsApi = createApi({
    reducerPath: "opsApi",
    tagTypes: [
        "Agreements",
        "ResearchProjects",
        "User",
        "Users",
        "AgreementTypes",
        "AgreementReasons",
        "ProcurementShops",
        "BudgetLineItems",
        "AgreementHistory",
        "Portfolios",
        "CanFunding",
        "Notifications",
        "ResearchMethodologies",
        "SpecialTopics",
        "ServicesComponents",
        "ChangeRequests",
        "Divisions",
        "Documents",
        "Cans",
        "ProcurementTrackers",
        "Procurement Tracker Steps"
    ],
    baseQuery: getBaseQueryWithReauth(baseQuery),
    endpoints: (builder) => ({
        getAgreements: builder.query({
            query: ({
                filters: { fiscalYear, budgetLineStatus, portfolio, agreementName, agreementType },
                onlyMy,
                sortConditions,
                sortDescending,
                page,
                limit = 10
            }) => {
                const queryParams = [];
                if (fiscalYear) {
                    fiscalYear.forEach((year) => queryParams.push(`fiscal_year=${year.title}`));
                }
                if (budgetLineStatus) {
                    budgetLineStatus.forEach((status) => queryParams.push(`budget_line_status=${status.status}`));
                }
                if (portfolio) {
                    portfolio.forEach((portfolio) => queryParams.push(`portfolio=${portfolio.id}`));
                }
                if (agreementName) {
                    agreementName.forEach((name) => queryParams.push(`name=${encodeURIComponent(name.display_name)}`));
                }
                if (agreementType) {
                    agreementType.forEach((type) =>
                        queryParams.push(`agreement_type=${encodeURIComponent(type.type)}`)
                    );
                }
                if (onlyMy) {
                    queryParams.push("only_my=true");
                }
                if (sortConditions) {
                    queryParams.push(`sort_conditions=${sortConditions}`);
                    // We only care about the sort direction if sort condition is non-null
                    queryParams.push(`sort_descending=${sortDescending}`);
                }
                // Add pagination parameters
                if (page !== undefined && page !== null) {
                    queryParams.push(`limit=${limit}`);
                    queryParams.push(`offset=${page * limit}`);
                }
                return `/agreements/?${queryParams.join("&")}`;
            },
            transformResponse: (response) => {
                // New wrapped format with type-neutral key
                if (response.data) {
                    return {
                        agreements: response.data, // Keep "agreements" name for internal use
                        count: response.count,
                        limit: response.limit,
                        offset: response.offset
                    };
                }
                // Backward compatibility with old "agreements" key
                if (response.agreements) {
                    return {
                        agreements: response.agreements,
                        count: response.count,
                        limit: response.limit,
                        offset: response.offset
                    };
                }
                // Legacy array format (no pagination)
                return {
                    agreements: response,
                    count: response.length,
                    limit: response.length,
                    offset: 0
                };
            },
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
        getAgreementAgencies: builder.query({
            query: ({ requesting, servicing, simulatedError, page, limit }) => {
                const queryParams = [];
                if (requesting) {
                    queryParams.push(`requesting=${requesting}`);
                }
                if (servicing) {
                    queryParams.push(`servicing=${servicing}`);
                }
                // add pagination parameters
                if (page !== undefined && page !== null) {
                    queryParams.push(`limit=${limit}`);
                    queryParams.push(`offset=${page * limit}`);
                }
                if (simulatedError) {
                    queryParams.push(`simulatedError=${simulatedError}`);
                }
                return `/agreement-agencies/?${queryParams.join("&")}`;
            },
            providesTags: ["Agreements"]
        }),
        // NOTE: will fetch 50 agencies due to limit on backend
        getAllAgreementAgencies: builder.query({
            query: ({ requesting, servicing, simulatedError }) => {
                const queryParams = [];
                if (requesting) {
                    queryParams.push(`requesting=${requesting}`);
                }
                if (servicing) {
                    queryParams.push(`servicing=${servicing}`);
                }
                if (simulatedError) {
                    queryParams.push(`simulatedError=${simulatedError}`);
                }
                queryParams.push(`limit=${MAX_RESULTS_LIMIT}`);
                queryParams.push("offset=0");
                return `/agreement-agencies/?${queryParams.join("&")}`;
            },
            providesTags: ["Agreements"]
        }),
        getBudgetLineItemsFilterOptions: builder.query({
            query: ({ onlyMy, enableObe }) => {
                const queryParams = [];
                if (onlyMy) {
                    queryParams.push("only_my=true");
                }
                if (enableObe) {
                    queryParams.push("enable_obe=true");
                }
                return `/budget-line-items-filters/?${queryParams.join("&")}`;
            },
            providesTags: ["BudgetLineItems"]
        }),
        getBudgetLineItems: builder.query({
            query: ({
                filters: {
                    fiscalYears,
                    bliStatus,
                    portfolios,
                    agreementIds,
                    budgetLineTotalMin,
                    budgetLineTotalMax,
                    agreementTypes,
                    agreementTitles,
                    canActivePeriods
                },
                page,
                onlyMy,
                includeFees,
                sortConditions,
                sortDescending,
                enableObe,
                limit = 10
            }) => {
                const queryParams = [];

                if (fiscalYears) {
                    fiscalYears.forEach((year) => queryParams.push(`fiscal_year=${year.title}`));
                }
                if (bliStatus) {
                    bliStatus.forEach((status) => queryParams.push(`budget_line_status=${status.status}`));
                }
                if (portfolios) {
                    portfolios.forEach((portfolio) => queryParams.push(`portfolio=${portfolio.id}`));
                }
                if (agreementIds) {
                    agreementIds.forEach((id) => queryParams.push(`agreement_id=${id}`));
                }
                if (budgetLineTotalMin) {
                    queryParams.push(`budget_line_total_min=${budgetLineTotalMin}`);
                }
                if (budgetLineTotalMax) {
                    queryParams.push(`budget_line_total_max=${budgetLineTotalMax}`);
                }
                if (agreementTypes) {
                    agreementTypes.forEach((type) =>
                        queryParams.push(`agreement_type=${encodeURIComponent(type.type)}`)
                    );
                }
                if (agreementTitles) {
                    agreementTitles.forEach((title) =>
                        queryParams.push(`agreement_name=${encodeURIComponent(title.name)}`)
                    );
                }
                if (canActivePeriods) {
                    canActivePeriods.forEach((period) =>
                        queryParams.push(`can_active_period=${encodeURIComponent(period.title)}`)
                    );
                }
                if (page !== undefined && page !== null) {
                    queryParams.push(`limit=${limit}`);
                    queryParams.push(`offset=${page * limit}`);
                }
                if (sortConditions) {
                    queryParams.push(`sort_conditions=${sortConditions}`);
                    // We only care about sort direction if there is a sort condition
                    queryParams.push(`sort_descending=${sortDescending}`);
                }
                if (onlyMy) {
                    queryParams.push("only_my=true");
                }
                if (includeFees) {
                    queryParams.push("include_fees=true");
                }
                if (enableObe) {
                    queryParams.push(`enable_obe=${enableObe}`);
                }
                return `/budget-line-items/?${queryParams.join("&")}`;
            },
            providesTags: ["BudgetLineItems"]
        }),
        getBudgetLineItem: builder.query({
            query: (id) => `/budget-line-items/${id}`,
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
            invalidatesTags: ["Agreements", "BudgetLineItems", "AgreementHistory", "ChangeRequests"]
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
        getProjects: builder.query({
            query: () => `/projects/`,
            providesTags: ["ResearchProjects"]
        }),
        getProjectsByPortfolio: builder.query({
            query: ({ fiscal_year, portfolio_id, search }) => {
                const queryParams = [];
                if (fiscal_year) {
                    queryParams.push(`fiscal_year=${fiscal_year}`);
                }
                if (portfolio_id) {
                    queryParams.push(`portfolio_id=${portfolio_id}`);
                }
                if (search) {
                    queryParams.push(`search=${search}`);
                }
                return `/projects/?${queryParams.join("&")}`;
            },
            providesTags: ["ResearchProjects"]
        }),
        getResearchProjectsByPortfolio: builder.query({
            query: ({ fiscal_year, portfolio_id, search }) => {
                const queryParams = [];
                if (fiscal_year) {
                    queryParams.push(`fiscal_year=${fiscal_year}`);
                }
                if (portfolio_id) {
                    queryParams.push(`portfolio_id=${portfolio_id}`);
                }
                if (search) {
                    queryParams.push(`search=${search}`);
                }
                return `/research-projects/?${queryParams.join("&")}`;
            },
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
        getProcurementShopById: builder.query({
            query: (id) => `/procurement-shops/${id}`,
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
            query: ({ id, data }) => ({
                url: `/users/${id}`,
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: data
            }),
            invalidatesTags: ["User", "Users"]
        }),
        getCans: builder.query({
            query: ({
                fiscalYear,
                sortConditions,
                sortDescending,
                page,
                limit = 10,
                activePeriod,
                transfer,
                portfolio,
                budgetMin,
                budgetMax
            }) => {
                let queryParams = [];
                if (fiscalYear) {
                    queryParams.push(`fiscal_year=${fiscalYear}`);
                }
                if (sortConditions) {
                    queryParams.push(`sort_conditions=${sortConditions}`);
                    queryParams.push(`sort_descending=${sortDescending}`);
                }
                // Add pagination parameters
                if (page !== undefined && page !== null) {
                    queryParams.push(`limit=${limit}`);
                    queryParams.push(`offset=${page * limit}`);
                }
                // Add filter parameters
                if (activePeriod && activePeriod.length > 0) {
                    activePeriod.forEach((period) => {
                        queryParams.push(`active_period=${period}`);
                    });
                }
                if (transfer && transfer.length > 0) {
                    transfer.forEach((t) => {
                        queryParams.push(`transfer=${t}`);
                    });
                }
                if (portfolio && portfolio.length > 0) {
                    portfolio.forEach((p) => {
                        queryParams.push(`portfolio=${p}`);
                    });
                }
                if (budgetMin !== undefined && budgetMin !== null) {
                    queryParams.push(`budget_min=${budgetMin}`);
                }
                if (budgetMax !== undefined && budgetMax !== null) {
                    queryParams.push(`budget_max=${budgetMax}`);
                }
                return `/cans/?${queryParams.join("&")}`;
            },
            transformResponse: (response) => {
                // New wrapped format with data key
                if (response.data) {
                    return {
                        cans: response.data, // Keep "cans" name for internal use
                        count: response.count,
                        limit: response.limit,
                        offset: response.offset
                    };
                }
                // Legacy array format (no pagination) - for backward compatibility during transition
                return {
                    cans: response,
                    count: response.length,
                    limit: response.length,
                    offset: 0
                };
            },
            providesTags: ["Cans"]
        }),
        getCanById: builder.query({
            query: (id) => `/cans/${id}`,
            providesTags: ["Cans"]
        }),
        updateCan: builder.mutation({
            query: ({ id, data }) => ({
                url: `/cans/${id}`,
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: data
            }),
            invalidatesTags: ["Cans"]
        }),
        addCanFundingBudgets: builder.mutation({
            query: ({ data }) => ({
                url: `/can-funding-budgets/`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: data
            }),
            invalidatesTags: ["Cans", "CanFunding"]
        }),
        updateCanFundingBudget: builder.mutation({
            query: ({ id, data }) => ({
                url: `/can-funding-budgets/${id}`,
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: data
            }),
            invalidatesTags: ["Cans", "CanFunding"]
        }),
        addCanFundingReceived: builder.mutation({
            query: ({ data }) => ({
                url: `/can-funding-received/`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: data
            }),
            invalidatesTags: ["Cans", "CanFunding"]
        }),
        updateCanFundingReceived: builder.mutation({
            query: ({ id, data }) => ({
                url: `/can-funding-received/${id}`,
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: data
            }),
            invalidatesTags: ["Cans", "CanFunding"]
        }),
        deleteCanFundingReceived: builder.mutation({
            query: (id) => ({
                url: `/can-funding-received/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["Cans", "CanFunding"]
        }),
        getCanFundingSummary: builder.query({
            query: ({ ids, fiscalYear, activePeriod, transfer, portfolio, fyBudgets }) => {
                const queryParams = [];

                if (ids && ids.length > 0) {
                    ids.forEach((id) => queryParams.push(`can_ids=${id}`));
                }

                if (fiscalYear) {
                    queryParams.push(`fiscal_year=${fiscalYear}`);
                }

                if (activePeriod && activePeriod.length > 0) {
                    activePeriod.forEach((period) => queryParams.push(`active_period=${period}`));
                }

                if (transfer && transfer.length > 0) {
                    transfer.forEach((t) => queryParams.push(`transfer=${t}`));
                }

                if (portfolio && portfolio.length > 0) {
                    portfolio.forEach((p) => queryParams.push(`portfolio=${p}`));
                }

                if (fyBudgets && fyBudgets.length === 2) {
                    queryParams.push(`fy_budget=${fyBudgets[0]}`);
                    queryParams.push(`fy_budget=${fyBudgets[1]}`);
                }

                return `/can-funding-summary/?${queryParams.join("&")}`;
            },
            providesTags: ["Cans", "CanFunding"]
        }),
        getCanHistory: builder.query({
            query: ({ canId, offset, limit, fiscalYear, sort }) => {
                const queryParams = [];
                if (limit) {
                    queryParams.push(`limit=${limit}`);
                }
                if (offset) {
                    queryParams.push(`offset=${offset}`);
                }
                if (fiscalYear) {
                    queryParams.push(`fiscal_year=${fiscalYear}`);
                }
                if (sort) {
                    queryParams.push(`sort_asc=${sort}`);
                }
                return `/can-history/?can_id=${canId}&${queryParams.join("&")}`;
            },
            providesTags: ["Cans"]
        }),
        getNotificationsByUserId: builder.query({
            query: ({ id }) => {
                if (!id) {
                    throw new Error("User ID is required");
                }
                return {
                    url: `/notifications/?oidc_id=${id}`
                };
            },
            providesTags: ["Notifications"],
            skip: (arg) => !arg?.id
        }),
        getNotificationsByUserIdAndAgreementId: builder.query({
            query: ({ user_oidc_id, agreement_id }) => {
                if (!user_oidc_id || !agreement_id) {
                    return { skip: true };
                }
                return {
                    url: `/notifications/?agreement_id=${agreement_id}&oidc_id=${user_oidc_id}&is_read=False`
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
        getPortfolioById: builder.query({
            query: (id) => `/portfolios/${id}`,
            providesTags: ["Portfolios"]
        }),
        getPortfolioCansById: builder.query({
            query: ({ portfolioId, year, budgetFiscalYear, includeInactive }) => {
                const queryParams = [];
                if (year) {
                    queryParams.push(`year=${year}`);
                }
                if (budgetFiscalYear) {
                    queryParams.push(`budgetFiscalYear=${budgetFiscalYear}`);
                }
                if (includeInactive) {
                    queryParams.push(`includeInactive=${includeInactive}`);
                }
                return `/portfolios/${portfolioId}/cans/?${queryParams.join("&")}`;
            },
            providesTags: ["Portfolios"]
        }),
        // NOTE: This endpoint will be deprecated in the future and replaced by getPortfolioFundingSummary
        getPortfolioCalcFunding: builder.query({
            query: ({ portfolioId, fiscalYear, simulatedError }) => {
                const queryParams = [];
                if (fiscalYear) {
                    queryParams.push(`fiscal_year=${fiscalYear}`);
                }
                if (simulatedError) {
                    queryParams.push(`simulatedError`);
                }
                return `/portfolios/${portfolioId}/calcFunding/?${queryParams.join("&")}`;
            },
            providesTags: ["Portfolios"]
        }),
        getPortfolioFundingSummary: builder.query({
            query: ({ portfolioId, fiscalYear, simulatedError }) => {
                const queryParams = [];
                if (fiscalYear) {
                    queryParams.push(`fiscal_year=${fiscalYear}`);
                }
                if (simulatedError) {
                    queryParams.push(`simulatedError`);
                }
                return `/portfolio-funding-summary/${portfolioId}?${queryParams.join("&")}`;
            },
            providesTags: ["Portfolios"]
        }),
        getPortfolioFundingSummaryBatch: builder.query({
            query: ({ fiscalYear, portfolioIds, budgetMin, budgetMax, availablePct }) => {
                const queryParams = [];
                if (fiscalYear) {
                    queryParams.push(`fiscal_year=${fiscalYear}`);
                }
                if (portfolioIds && portfolioIds.length > 0) {
                    // Send as repeated parameters for Marshmallow List field
                    portfolioIds.forEach((id) => {
                        queryParams.push(`portfolio_ids=${id}`);
                    });
                }
                if (budgetMin !== undefined && budgetMin !== null) {
                    queryParams.push(`budget_min=${budgetMin}`);
                }
                if (budgetMax !== undefined && budgetMax !== null) {
                    queryParams.push(`budget_max=${budgetMax}`);
                }
                if (availablePct && availablePct.length > 0) {
                    // Send as repeated parameters for Marshmallow List field
                    availablePct.forEach((pct) => {
                        queryParams.push(`available_pct=${pct}`);
                    });
                }
                return `/portfolio-funding-summary/?${queryParams.join("&")}`;
            },
            providesTags: ["Portfolios"]
        }),
        getPortfolioUrlById: builder.query({
            query: (id) => `/portfolios-url/${id}`,
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
            query: (agreementId) => `/services-components/?agreement_id=${agreementId}`,
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
            query: ({ userId }) => ({
                url: `/change-requests/${userId ? `?userId=${userId}` : ""}`
            }),
            providesTags: ["ChangeRequests"]
        }),
        updateChangeRequest: builder.mutation({
            query: (body) => {
                return {
                    url: `/change-requests/`,
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body
                };
            },
            invalidatesTags: ["ChangeRequests"]
        }),
        getDivisions: builder.query({
            query: () => `/divisions/`,
            providesTags: ["Divisions"]
        }),
        getDivision: builder.query({
            query: (division_id) => `/divisions/${division_id}`,
            providesTags: ["Divisions"]
        }),
        addDocument: builder.mutation({
            query: (data) => {
                return {
                    url: `/documents/`,
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: data
                };
            },
            invalidatesTags: ["Documents"]
        }),
        getDocumentsByAgreementId: builder.query({
            query: (agreement_id) => `/documents/${agreement_id}`,
            providesTags: ["Documents"]
        }),
        updateDocumentStatus: builder.mutation({
            query: ({ document_id, data }) => {
                return {
                    url: `/documents/${document_id}/status/`,
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: data
                };
            },
            invalidatesTags: ["Documents"]
        }),
        getResearchMethodologies: builder.query({
            query: () => `/research-methodologies/`,
            providesTags: ["ResearchMethodologies"]
        }),
        getSpecialTopics: builder.query({
            query: () => `/special-topics/`,
            providesTags: ["SpecialTopics"]
        }),
        getProcurementTrackersByAgreementId: builder.query({
            query: (agreement_id) => `/procurement-trackers/?agreement_id=${agreement_id}`,
            providesTags: ["ProcurementTrackers"]
        }),
        updateProcurementTrackerStep: builder.mutation({
            query: ({ stepId, data }) => {
                return {
                    url: `/procurement-tracker-steps/${stepId}`,
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: data
                };
            },
            invalidatesTags: ["ProcurementTrackers", "Procurement Tracker Steps"]
        })
    })
});

export const createResetApiOnLogoutMiddleware = (api) => (store) => (next) => (action) => {
    const result = next(action);
    if (action.type === logout.type) {
        console.log("Reset API state on logout middleware triggered");
        // Reset the API state when logout action is dispatched
        store.dispatch(api.util.resetApiState());
    }
    return result;
};

// Export the reset middleware so you can use it in your store configuration
export const resetApiOnLogoutMiddleware = createResetApiOnLogoutMiddleware(opsApi);

export const {
    useGetAgreementsQuery,
    useGetAgreementByIdQuery,
    useLazyGetAgreementByIdQuery,
    useLazyGetAgreementsQuery,
    useAddAgreementMutation,
    useUpdateAgreementMutation,
    useDeleteAgreementMutation,
    useGetAgreementAgenciesQuery,
    useGetAllAgreementAgenciesQuery,
    useAddBudgetLineItemMutation,
    useGetBudgetLineItemsFilterOptionsQuery,
    useGetBudgetLineItemsQuery,
    useLazyGetBudgetLineItemsQuery,
    useGetBudgetLineItemQuery,
    useLazyGetBudgetLineItemQuery,
    useUpdateBudgetLineItemMutation,
    useDeleteBudgetLineItemMutation,
    useGetAgreementsByResearchProjectFilterQuery,
    useGetUserByIdQuery,
    useLazyGetUserByIdQuery,
    useGetUserByOIDCIdQuery,
    useGetProjectsQuery,
    useGetProjectsByPortfolioQuery,
    useGetResearchProjectsQuery,
    useGetResearchProjectsByPortfolioQuery,
    useAddResearchProjectsMutation,
    useUpdateBudgetLineItemStatusMutation,
    useGetAgreementTypesQuery,
    useGetProductServiceCodesQuery,
    useGetProcurementShopsQuery,
    useLazyGetProcurementShopsQuery,
    useGetProcurementShopByIdQuery,
    useGetAgreementReasonsQuery,
    useGetUsersQuery,
    useGetUserQuery,
    useLazyGetUserQuery,
    useGetUserByOidcQuery,
    useAddUserMutation,
    useUpdateUserMutation,
    useGetCansQuery,
    useLazyGetCansQuery,
    useGetCanByIdQuery,
    useUpdateCanMutation,
    useAddCanFundingBudgetsMutation,
    useUpdateCanFundingBudgetMutation,
    useAddCanFundingReceivedMutation,
    useUpdateCanFundingReceivedMutation,
    useDeleteCanFundingReceivedMutation,
    useGetCanFundingSummaryQuery,
    useGetCanHistoryQuery,
    useGetNotificationsByUserIdQuery,
    useGetNotificationsByUserIdAndAgreementIdQuery,
    useDismissNotificationMutation,
    useGetPortfoliosQuery,
    useGetPortfolioByIdQuery,
    useLazyGetPortfolioByIdQuery,
    useGetPortfolioCansByIdQuery,
    useGetPortfolioCalcFundingQuery,
    useGetPortfolioFundingSummaryQuery,
    useLazyGetPortfolioFundingSummaryQuery,
    useGetPortfolioFundingSummaryBatchQuery,
    useGetPortfolioUrlByIdQuery,
    useAddBliPackageMutation,
    useGetAzureSasTokenQuery,
    useAddServicesComponentMutation,
    useUpdateServicesComponentMutation,
    useGetServicesComponentByIdQuery,
    useLazyGetServicesComponentByIdQuery,
    useGetServicesComponentsListQuery,
    useDeleteServicesComponentMutation,
    useGetChangeRequestsListQuery,
    useUpdateChangeRequestMutation,
    useGetDivisionsQuery,
    useGetDivisionQuery,
    useAddDocumentMutation,
    useGetDocumentsByAgreementIdQuery,
    useUpdateDocumentStatusMutation,
    useGetResearchMethodologiesQuery,
    useGetSpecialTopicsQuery,
    useGetProcurementTrackersByAgreementIdQuery,
    useUpdateProcurementTrackerStepMutation
} = opsApi;
