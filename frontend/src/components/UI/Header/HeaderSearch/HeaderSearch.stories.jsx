import { userEvent, within } from "storybook/test";
import HeaderSearch from "./HeaderSearch";

const RESULTS = [
    { id: 11, name: "Child Care Study", nick_name: "CCS", agreement_type: "CONTRACT", odn: "PO-TEST-0001" },
    { id: 12, name: "Head Start Study", nick_name: null, agreement_type: "CONTRACT", odn: "PO-TEST-0002" },
    { id: 13, name: "Task Order Study", nick_name: "TOS", agreement_type: "AA", odn: "TO-TEST-0001" }
];

/**
 * Storybook has no MSW, so stub window.fetch for the search endpoint only.
 * @param {{status?: number, data?: object[], count?: number}} response - What the endpoint returns.
 */
const withSearchResponse = ({ status = 200, data = RESULTS, count = data.length } = {}) => {
    const decorator = (Story) => {
        const originalFetch = window.fetch;
        window.fetch = (input, init) => {
            const url = typeof input === "string" ? input : input.url;
            if (url.includes("/agreements-search/")) {
                return Promise.resolve(
                    new Response(JSON.stringify({ data, count, limit: 5, offset: 0 }), {
                        status,
                        headers: { "Content-Type": "application/json" }
                    })
                );
            }
            return originalFetch(input, init);
        };
        return <Story />;
    };
    decorator.displayName = "withSearchResponse";
    return decorator;
};

const typeQuery = (query) => async (context) => {
    const input = within(context.canvasElement).getByRole("combobox", { name: "Search agreements" });
    await userEvent.type(input, query);
};

export default {
    title: "UI/Header/HeaderSearch",
    component: HeaderSearch,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component:
                    "Type-ahead agreement search (WAI-ARIA editable combobox). Matches on ODN, agreement title or " +
                    "nickname. Click a result to open it, or press Enter / click the magnifier for the full results " +
                    "page. Stories that show results stub the search request and type a query automatically."
            }
        },
        store: { preloadedState: { auth: { isLoggedIn: true, activeUser: { id: 1, roles: [] } } } }
    }
};

export const Default = {};

export const WithResults = {
    decorators: [withSearchResponse()],
    play: typeQuery("study")
};

export const MoreResultsThanShown = {
    decorators: [withSearchResponse({ count: 37 })],
    play: typeQuery("study")
};

export const NoResults = {
    decorators: [withSearchResponse({ data: [], count: 0 })],
    play: typeQuery("zzz")
};

export const ErrorState = {
    decorators: [withSearchResponse({ status: 500 })],
    play: typeQuery("study")
};

export const PrefilledOnSearchPage = {
    parameters: { reactRouter: { initialEntries: ["/search?q=PO-TEST"] } }
};
