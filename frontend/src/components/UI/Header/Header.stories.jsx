import Header from "./Header";

export default {
    title: "UI/Header",
    component: Header,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Site header containing the OPRE logo, primary navigation (NavMenu), and auth section. " +
                    "NavMenu conditionally renders links based on user roles from Redux state."
            }
        }
    }
};

export const LoggedInBasicUser = {
    parameters: {
        store: {
            preloadedState: {
                auth: {
                    isLoggedIn: true,
                    activeUser: {
                        id: 1,
                        full_name: "Chris Doe",
                        oidc_id: "user-123",
                        roles: [{ name: "BUDGET_TEAM" }]
                    }
                }
            }
        },
        reactRouter: { initialEntries: ["/"] }
    }
};

export const LoggedInAdmin = {
    parameters: {
        store: {
            preloadedState: {
                auth: {
                    isLoggedIn: true,
                    activeUser: {
                        id: 2,
                        full_name: "Admin User",
                        oidc_id: "admin-456",
                        roles: [{ name: "USER_ADMIN" }, { name: "BUDGET_TEAM" }]
                    }
                }
            }
        },
        reactRouter: { initialEntries: ["/"] }
    }
};

export const LoggedInProcurement = {
    parameters: {
        store: {
            preloadedState: {
                auth: {
                    isLoggedIn: true,
                    activeUser: {
                        id: 3,
                        full_name: "Procurement Specialist",
                        oidc_id: "proc-789",
                        roles: [{ name: "PROCUREMENT_TRACKER" }]
                    }
                }
            }
        },
        reactRouter: { initialEntries: ["/"] }
    }
};
