import { fn } from "storybook/test";
import PaginationNav from "./PaginationNav";

export default {
    title: "UI/PaginationNav",
    component: PaginationNav,
    parameters: {
        docs: {
            description: {
                component:
                    "USWDS pagination component with Previous/Next navigation and page number slots. " +
                    "Shows overflow indicators when pages exceed the visible slot count."
            }
        }
    },
    argTypes: {
        currentPage: {
            control: { type: "number", min: 1 },
            description: "Currently active page"
        },
        totalPages: {
            control: { type: "number", min: 1 },
            description: "Total number of pages"
        }
    },
    args: {
        setCurrentPage: fn()
    }
};

/** First page — no Previous button visible. */
export const FirstPage = {
    args: {
        currentPage: 1,
        totalPages: 10
    }
};

/** Middle page — both Previous and Next visible, with overflow indicators. */
export const MiddlePage = {
    args: {
        currentPage: 5,
        totalPages: 10
    }
};

/** Last page — no Next button visible. */
export const LastPage = {
    args: {
        currentPage: 10,
        totalPages: 10
    }
};

/** Few pages — all page numbers visible without overflow. */
export const FewPages = {
    args: {
        currentPage: 2,
        totalPages: 3
    }
};
