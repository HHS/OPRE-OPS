import { configure, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ITEMS_PER_PAGE } from "../../constants";
import { setupStore } from "../../store";
import { server } from "../../tests/mocks";
import SearchResults from "./SearchResults";

configure({ asyncUtilTimeout: 5000 });

// A page size that differs from the production value (25) and the default (10), so a hard-coded size shows up.
vi.mock("../../constants", async (importOriginal) => ({ ...(await importOriginal()), ITEMS_PER_PAGE: 7 }));

// The page chrome is stubbed with the same shape as DefaultLayout: a header (outside <main>) and the page
// content inside <main>. The breadcrumb label is passed through.
vi.mock("../../App", () => ({
    default: ({ children, breadCrumbName }) => (
        <div>
            <header>
                <input
                    aria-label="Header search"
                    data-testid="header-input"
                />
            </header>
            <span data-testid="breadcrumb">{breadCrumbName}</span>
            <main>{children}</main>
        </div>
    )
}));

const LocationProbe = () => {
    const { pathname, search } = useLocation();
    const navigationType = useNavigationType();
    return (
        <>
            <div data-testid="location">{`${pathname}${search}`}</div>
            <div data-testid="navigation-type">{navigationType}</div>
        </>
    );
};

const BackButton = () => {
    const navigate = useNavigate();
    return <button onClick={() => navigate(-1)}>back</button>;
};

const mockSearch = (respond) => {
    const requests = [];
    server.use(
        http.get("*/api/v1/agreements-search/", async ({ request }) => {
            const params = new URL(request.url).searchParams;
            requests.push(Object.fromEntries(params));
            const body = await respond(Object.fromEntries(params));
            if (body instanceof Response) {
                return body;
            }
            return HttpResponse.json({ limit: ITEMS_PER_PAGE, offset: 0, ...body });
        })
    );
    return requests;
};

const renderPage = (route) => {
    const user = userEvent.setup();
    render(
        <Provider store={setupStore()}>
            <MemoryRouter initialEntries={[route]}>
                <SearchResults />
                <LocationProbe />
                <BackButton />
            </MemoryRouter>
        </Provider>
    );
    return { user };
};

const row = (id, overrides = {}) => ({
    id,
    name: `Agreement ${id}`,
    nick_name: null,
    agreement_type: "CONTRACT",
    odn: null,
    ...overrides
});

describe("SearchResults", () => {
    it("shows a prompt and sends no request when q is missing or blank", async () => {
        const requests = mockSearch(() => ({ data: [], count: 0 }));
        renderPage("/search?q=%20%20");

        expect(screen.getByRole("heading", { name: "Search results" })).toBeInTheDocument();
        expect(screen.getByTestId("breadcrumb")).toHaveTextContent("Search");
        expect(screen.getByText("Enter an ODN, agreement title, or nickname to search.")).toBeInTheDocument();
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(requests).toHaveLength(0);
    });

    it("shows the prompt, without crashing, when there is no q param at all", async () => {
        const requests = mockSearch(() => ({ data: [], count: 0 }));
        renderPage("/search");

        expect(screen.getByText("Enter an ODN, agreement title, or nickname to search.")).toBeInTheDocument();
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(requests).toHaveLength(0);
    });

    it("renders rows with links, types and the field each agreement matched on", async () => {
        const requests = mockSearch(() => ({
            data: [
                row(1, { name: "Child Care Study", odn: "PO-TEST-0001", nick_name: "CCS" }),
                row(2, { name: "Head Start Test", agreement_type: "GRANT" }),
                row(3, { name: "Other", nick_name: "my-test-nick", agreement_type: "AA" })
            ],
            count: 3
        }));
        renderPage("/search?q=test");

        expect(await screen.findByText('3 agreements matching "test"')).toBeInTheDocument();
        expect(requests[0]).toMatchObject({ q: "test", limit: "7", offset: "0" });
        expect(screen.getByRole("status")).toHaveTextContent('3 agreements matching "test"');
        expect(screen.getAllByRole("columnheader").map((heading) => heading.textContent)).toEqual([
            "Agreement",
            "Type",
            "Matched on"
        ]);

        const links = screen.getAllByRole("link");
        expect(links.map((link) => link.getAttribute("href"))).toEqual([
            "/agreements/1",
            "/agreements/2",
            "/agreements/3"
        ]);

        const [odnRow, titleRow, nickRow] = screen.getAllByRole("row").slice(1);
        expect(within(odnRow).getByText("Contract")).toBeInTheDocument();
        expect(odnRow).toHaveTextContent("ODN: PO-TEST-0001");
        // eslint-disable-next-line testing-library/no-node-access
        expect(odnRow.querySelector("mark")).toHaveTextContent("TEST");
        expect(titleRow).toHaveTextContent("Grant");
        expect(titleRow).toHaveTextContent("Title: Head Start Test");
        expect(nickRow).toHaveTextContent("Partner - AA");
        expect(nickRow).toHaveTextContent("Nickname: my-test-nick");
    });

    it("uses the singular for one agreement", async () => {
        mockSearch(() => ({ data: [row(1)], count: 1 }));
        renderPage("/search?q=Agreement");

        expect(await screen.findByText('1 agreement matching "Agreement"')).toBeInTheDocument();
    });

    it("shows an empty state when nothing matches", async () => {
        mockSearch(() => ({ data: [], count: 0 }));
        renderPage("/search?q=zzz");

        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/No agreements match "zzz"/));
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
        // Nothing to page through: the URL must not be rewritten (e.g. to page=0).
        expect(screen.getByTestId("location")).toHaveTextContent(/^\/search\?q=zzz$/);
    });

    it("shows an error state when the request fails", async () => {
        mockSearch(() => new Response(null, { status: 500 }));
        renderPage("/search?q=po");

        expect(await screen.findByRole("alert")).toHaveTextContent("There was an error searching for agreements");
    });

    it("retries the same query from the error state", async () => {
        let fail = true;
        const requests = mockSearch(() => (fail ? new Response(null, { status: 500 }) : { data: [row(1)], count: 1 }));
        const { user } = renderPage("/search?q=po");

        await screen.findByRole("alert");
        fail = false;
        await user.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByRole("table")).toBeInTheDocument();
        expect(requests).toHaveLength(2);
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("keeps focus on the heading when a retry fails again", async () => {
        const requests = mockSearch(() => new Response(null, { status: 500 }));
        const { user } = renderPage("/search?q=po");

        await screen.findByRole("alert");
        await user.click(screen.getByRole("button", { name: "Try again" }));

        await waitFor(() => expect(requests).toHaveLength(2));
        expect(await screen.findByRole("alert")).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    });

    it("shows a loading message while the first request is in flight", async () => {
        mockSearch(() => ({ data: [row(1)], count: 1 }));
        renderPage("/search?q=po");

        expect(screen.getByRole("status")).toHaveTextContent("Searching…");
        // Results have not arrived, so focus has not been pulled to the heading yet.
        expect(screen.getByRole("heading", { name: "Search results" })).not.toHaveFocus();
        await screen.findByRole("table");
    });

    it("pages through the results using the 1-based page URL param", async () => {
        const total = ITEMS_PER_PAGE * 3 + 1;
        const requests = mockSearch(({ offset }) => ({
            data: [row(Number(offset) + 1)],
            count: total,
            offset: Number(offset)
        }));
        const { user } = renderPage("/search?q=po&page=2");

        // page=2 asks for the second slice.
        expect(await screen.findByRole("link", { name: `Agreement ${ITEMS_PER_PAGE + 1}` })).toBeInTheDocument();
        expect(requests[0]).toMatchObject({ offset: String(ITEMS_PER_PAGE) });

        // The current page is marked, and there are exactly four pages (not five).
        expect(screen.getByRole("button", { name: "Page 2" })).toHaveClass("usa-current");
        expect(screen.getByRole("button", { name: "Page 1" })).not.toHaveClass("usa-current");
        expect(screen.getByRole("button", { name: "Page 4" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Page 5" })).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Page 3" }));

        expect(screen.getByTestId("location")).toHaveTextContent("/search?q=po&page=3");
        expect(await screen.findByRole("link", { name: `Agreement ${ITEMS_PER_PAGE * 2 + 1}` })).toBeInTheDocument();
        // Rows from the previous page are gone.
        expect(screen.queryByRole("link", { name: `Agreement ${ITEMS_PER_PAGE + 1}` })).not.toBeInTheDocument();

        // Paging adds a history entry, so Back returns to the previous page.
        expect(screen.getByTestId("navigation-type")).toHaveTextContent("PUSH");
        await user.click(screen.getByRole("button", { name: "back" }));
        expect(screen.getByTestId("location")).toHaveTextContent("/search?q=po&page=2");
    });

    it("hides the previous page's rows while the next page is loading", async () => {
        const total = ITEMS_PER_PAGE * 2 + 1;
        server.use(
            http.get("*/api/v1/agreements-search/", async ({ request }) => {
                const offset = Number(new URL(request.url).searchParams.get("offset"));
                if (offset > 0) {
                    await delay(300);
                }
                return HttpResponse.json({ limit: ITEMS_PER_PAGE, offset, count: total, data: [row(offset + 1)] });
            })
        );
        const { user } = renderPage("/search?q=po");
        await screen.findByRole("link", { name: "Agreement 1" });

        await user.click(screen.getByRole("button", { name: "Page 2" }));

        // Until page 2 arrives, page 1's rows must not sit under the page-2 URL.
        expect(screen.queryByRole("link", { name: "Agreement 1" })).not.toBeInTheDocument();
        expect(screen.getByText("Searching…")).toBeInTheDocument();
        expect(await screen.findByRole("link", { name: `Agreement ${ITEMS_PER_PAGE + 1}` })).toBeInTheDocument();
    });

    it("treats an invalid page param as page 1 and hides pagination for a single page", async () => {
        const requests = mockSearch(() => ({ data: [row(1)], count: 1 }));
        renderPage("/search?q=po&page=abc");

        await screen.findByRole("table");
        expect(requests[0]).toMatchObject({ offset: "0" });
        expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
        // A single page is already the last page: the URL is left alone.
        expect(screen.getByTestId("location")).toHaveTextContent(/^\/search\?q=po&page=abc$/);
    });

    it.each(["0", "-3"])("treats page=%s as page 1", async (page) => {
        const requests = mockSearch(() => ({ data: [row(1)], count: 1 }));
        renderPage(`/search?q=po&page=${page}`);

        await screen.findByRole("table");
        expect(requests[0]).toMatchObject({ offset: "0" });
    });

    it("shows pagination when the results fill exactly two pages", async () => {
        mockSearch(({ offset }) => ({ data: [row(Number(offset) + 1)], count: ITEMS_PER_PAGE + 1 }));
        renderPage("/search?q=po");

        await screen.findByRole("table");
        expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Page 2" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Page 3" })).not.toBeInTheDocument();
    });

    it("redirects a page past the last one to the last page instead of showing an empty table", async () => {
        const total = ITEMS_PER_PAGE + 1;
        mockSearch(({ offset }) => ({
            data: Number(offset) >= total ? [] : [row(Number(offset) + 1)],
            count: total,
            offset: Number(offset)
        }));
        renderPage("/search?q=po&page=999");

        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/search?q=po&page=2"));
        expect(await screen.findByRole("link", { name: `Agreement ${ITEMS_PER_PAGE + 1}` })).toBeInTheDocument();
        // Replaced, not pushed: Back must not return to the out-of-range page.
        expect(screen.getByTestId("navigation-type")).toHaveTextContent("REPLACE");
    });

    it("returns focus to the heading after paging, once the new page has loaded", async () => {
        mockSearch(({ offset }) => ({ data: [row(Number(offset) + 1)], count: ITEMS_PER_PAGE * 2 }));
        const { user } = renderPage("/search?q=po");
        await screen.findByRole("table");

        await user.click(screen.getByRole("button", { name: "Page 2" }));

        await screen.findByRole("link", { name: `Agreement ${ITEMS_PER_PAGE + 1}` });
        await waitFor(() => expect(screen.getByRole("heading", { name: "Search results" })).toHaveFocus());
    });

    it("does not pull focus out of the header box while the user types there and results arrive", async () => {
        mockSearch(async () => {
            await delay(300);
            return { data: [row(1)], count: 1 };
        });
        const { user } = renderPage("/search?q=po");
        const headerInput = screen.getByTestId("header-input");
        await user.click(headerInput);
        await user.keyboard("new query");

        await screen.findByRole("table");

        expect(headerInput).toHaveFocus();
        expect(headerInput).toHaveValue("new query");
        expect(screen.getByRole("heading", { name: "Search results" })).not.toHaveFocus();
    });

    it("asks the server again when a query that is still cached is visited again", async () => {
        const requests = mockSearch(() => ({ data: [row(1)], count: 1 }));
        const store = setupStore();
        const tree = (
            <Provider store={store}>
                <MemoryRouter initialEntries={["/search?q=po"]}>
                    <SearchResults />
                </MemoryRouter>
            </Provider>
        );
        const view = render(tree);
        await screen.findByRole("table");
        view.unmount();

        // Same store, within the cache window: renamed or deleted agreements must not show up stale.
        render(tree);
        await screen.findByRole("table");

        await waitFor(() => expect(requests).toHaveLength(2), { timeout: 2000 });
    });

    it("moves focus to the heading once results load", async () => {
        mockSearch(() => ({ data: [row(1)], count: 1 }));
        renderPage("/search?q=po");

        await waitFor(() => expect(screen.getByRole("heading", { name: "Search results" })).toHaveFocus());
    });
});
