import Breadcrumb from "./Breadcrumb";

export default {
    title: "UI/Header/Breadcrumb",
    component: Breadcrumb,
    parameters: {
        docs: {
            description: {
                component:
                    "Context-aware breadcrumb trail. When a stored nav-context trail matches the current path, its ancestors render as links; otherwise the canonical route hierarchy is used. Home and the leaf name always render."
            }
        }
    },
    argTypes: {
        currentName: { control: "text", description: "Leaf breadcrumb (current page) name" }
    }
};

/** Fallback: no stored trail — only Home and the leaf render (route crumbs require a data router). */
export const Fallback = {
    args: {
        currentName: "Agreement 1"
    }
};

/** Context-aware: a stored trail for the current path renders ancestor links. */
export const WithStoredTrail = {
    args: {
        currentName: "Agreement 1"
    },
    parameters: {
        reactRouter: { initialEntries: ["/agreements/1"] },
        store: {
            preloadedState: {
                sessionUI: {
                    navContext: {
                        trail: {
                            targetPath: "/agreements/1",
                            ancestors: [
                                { label: "Portfolios", to: "/portfolios" },
                                { label: "Portfolio A", to: "/portfolios/5" }
                            ]
                        }
                    }
                }
            }
        }
    }
};

/** Deep drill-down: Portfolios > Portfolio A > CAN 1 > Agreement 1. */
export const DeepTrail = {
    args: {
        currentName: "Agreement 1"
    },
    parameters: {
        reactRouter: { initialEntries: ["/agreements/1"] },
        store: {
            preloadedState: {
                sessionUI: {
                    navContext: {
                        trail: {
                            targetPath: "/agreements/1",
                            ancestors: [
                                { label: "Portfolios", to: "/portfolios" },
                                { label: "Portfolio A", to: "/portfolios/5" },
                                { label: "CAN 1", to: "/cans/1" }
                            ]
                        }
                    }
                }
            }
        }
    }
};
