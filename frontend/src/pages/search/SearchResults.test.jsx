import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ITEMS_PER_PAGE } from "../../constants";
import { setupStore } from "../../store";
import { server } from "../../tests/mocks";
import SearchResults from "./SearchResults";

// The page chrome (header, breadcrumbs, footer) is not under test here.
vi.mock("../../App", () => ({ default: ({ children }) => <div>{children}</div> }));

const LocationProbe = () => {
    const { pathname, search } = useLocation();
    return <div data-testid="location">{`${pathname}${search}`}</div>;
};

const mockSearch = (respond) => {
    const requests = [];
    server.use(
        http.get("*/api/v1/agreements-search/", ({ request }) => {
            const params = new URL(request.url).searchParams;
            requests.push(Object.fromEntries(params));
            const body = respond(Object.fromEntries(params));
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
        expect(requests[0]).toMatchObject({ q: "test", limit: String(ITEMS_PER_PAGE), offset: "0" });

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

        expect(await screen.findByText(/No agreements match "zzz"/)).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("shows an error state when the request fails", async () => {
        mockSearch(() => new Response(null, { status: 500 }));
        renderPage("/search?q=po");

        expect(await screen.findByRole("alert")).toHaveTextContent("There was an error searching for agreements");
    });

    it("shows a loading message while the first request is in flight", async () => {
        mockSearch(() => ({ data: [row(1)], count: 1 }));
        renderPage("/search?q=po");

        expect(screen.getByText("Searching…")).toBeInTheDocument();
        await screen.findByRole("table");
    });

    it("pages through the results using the 1-based page URL param", async () => {
        const total = ITEMS_PER_PAGE * 2 + 1;
        const requests = mockSearch(({ offset }) => ({
            data: [row(Number(offset) + 1)],
            count: total,
            offset: Number(offset)
        }));
        const { user } = renderPage("/search?q=po&page=2");

        // page=2 asks for the second slice.
        expect(await screen.findByRole("link", { name: `Agreement ${ITEMS_PER_PAGE + 1}` })).toBeInTheDocument();
        expect(requests[0]).toMatchObject({ offset: String(ITEMS_PER_PAGE) });

        await user.click(screen.getByRole("button", { name: "Page 3" }));

        expect(screen.getByTestId("location")).toHaveTextContent("/search?q=po&page=3");
        expect(await screen.findByRole("link", { name: `Agreement ${ITEMS_PER_PAGE * 2 + 1}` })).toBeInTheDocument();
        // Rows from the previous page are gone.
        expect(screen.queryByRole("link", { name: `Agreement ${ITEMS_PER_PAGE + 1}` })).not.toBeInTheDocument();
    });

    it("treats an invalid page param as page 1 and hides pagination for a single page", async () => {
        const requests = mockSearch(() => ({ data: [row(1)], count: 1 }));
        renderPage("/search?q=po&page=abc");

        await screen.findByRole("table");
        expect(requests[0]).toMatchObject({ offset: "0" });
        expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
    });

    it("moves focus to the heading once results load", async () => {
        mockSearch(() => ({ data: [row(1)], count: 1 }));
        renderPage("/search?q=po");

        await waitFor(() => expect(screen.getByRole("heading", { name: "Search results" })).toHaveFocus());
    });
});
