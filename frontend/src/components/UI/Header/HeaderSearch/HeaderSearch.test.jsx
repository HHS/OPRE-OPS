/* eslint-disable testing-library/no-node-access -- the footer/error rows and <mark> have no role to query by */
import { configure, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { setupStore } from "../../../../store";
import { server } from "../../../../tests/mocks";
import Header from "../Header";
import HeaderSearch from "./HeaderSearch";

const PO_1 = { id: 11, name: "Child Care Study", nick_name: "CCS", agreement_type: "CONTRACT", odn: "PO-TEST-0001" };
const PO_2 = { id: 12, name: "Head Start Study", nick_name: null, agreement_type: "CONTRACT", odn: "PO-TEST-0002" };

const LocationProbe = () => {
    const { pathname, search } = useLocation();
    return <div data-testid="location">{`${pathname}${search}`}</div>;
};

/** Registers a handler that records each request's q and answers with `respond(q)`. */
const mockSearch = (respond = () => ({ data: [PO_1, PO_2], count: 2 })) => {
    const requests = [];
    server.use(
        http.get("*/api/v1/agreements-search/", async ({ request }) => {
            const q = new URL(request.url).searchParams.get("q");
            requests.push(q);
            const body = await respond(q);
            if (body instanceof Response) {
                return body;
            }
            return HttpResponse.json({ limit: 5, offset: 0, ...body });
        })
    );
    return requests;
};

const renderSearch = (ui = <HeaderSearch />, route = "/") => {
    const store = setupStore({ auth: { isLoggedIn: true, activeUser: { id: 1, roles: [] } } });
    const user = userEvent.setup();
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route
                        path="*"
                        element={
                            <>
                                {ui}
                                <LocationProbe />
                            </>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
    return { user, store, input: screen.getByRole("combobox", { name: "Search agreements" }) };
};

// 300ms debounce + MSW latency can exceed the 1000ms default on a loaded CI runner.
configure({ asyncUtilTimeout: 5000 });

const location = () => screen.getByTestId("location").textContent;

// AuthSection logs the user out on mount when there is no stored token; irrelevant here.
vi.mock("../../../Auth/AuthSection", () => ({ default: () => null }));

describe("HeaderSearch", () => {
    describe("ARIA", () => {
        it("renders a labelled combobox in a search landmark with an always-mounted listbox", () => {
            const { input } = renderSearch();

            expect(screen.getByRole("search")).toBeInTheDocument();
            expect(input).toHaveAttribute("aria-autocomplete", "list");
            expect(input).toHaveAttribute("aria-expanded", "false");
            expect(input).not.toHaveAttribute("aria-activedescendant");
            expect(input).toHaveAttribute("placeholder", "ODN, agreement title, or nickname");
            // The listbox exists (hidden) so aria-controls never dangles.
            const listbox = screen.getByRole("listbox", { hidden: true });
            expect(input).toHaveAttribute("aria-controls", listbox.id);
            expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
        });

        it("expands and lists options once results arrive", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");

            expect(await screen.findAllByRole("option")).toHaveLength(2);
            expect(input).toHaveAttribute("aria-expanded", "true");
            expect(screen.getByRole("status")).toHaveTextContent("2 results");
        });
    });

    describe("requests", () => {
        it("collapses fast typing into a single request", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");

            expect(requests).toEqual(["PO-TEST"]);
        });

        it("does not search below 2 characters", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "a");
            await new Promise((resolve) => setTimeout(resolve, 450));

            expect(requests).toHaveLength(0);
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("ignores a stale response that arrives after a newer search", async () => {
            const requests = mockSearch(async (q) => {
                if (q === "ab") {
                    await delay(600);
                    return { data: [{ ...PO_1, name: "STALE RESULT" }], count: 1 };
                }
                return { data: [{ ...PO_2, name: "Fresh Result" }], count: 1 };
            });
            const { user, input } = renderSearch();

            await user.type(input, "ab");
            await waitFor(() => expect(requests).toEqual(["ab"]), { timeout: 5000 });
            await user.type(input, "c");

            expect(await screen.findByRole("option", { name: /Fresh Result/ })).toBeInTheDocument();
            await new Promise((resolve) => setTimeout(resolve, 1000));
            expect(screen.queryByText(/STALE RESULT/)).not.toBeInTheDocument();
            expect(requests).toEqual(["ab", "abc"]);
        });

        it("cancels a pending search when the input is cleared", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO");
            await user.clear(input);
            await new Promise((resolve) => setTimeout(resolve, 450));

            expect(requests).toHaveLength(0);
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("does not reopen the dropdown when a response arrives after focus leaves the box", async () => {
            const requests = mockSearch(async () => {
                await delay(300);
                return { data: [PO_1], count: 1 };
            });
            const { user, input } = renderSearch(
                <>
                    <HeaderSearch />
                    <button type="button">Elsewhere</button>
                </>
            );

            await user.type(input, "PO-TEST");
            await waitFor(() => expect(requests).toHaveLength(1), { timeout: 5000 });
            await user.click(screen.getByRole("button", { name: "Elsewhere" }));
            await new Promise((resolve) => setTimeout(resolve, 500));

            expect(input).not.toHaveFocus();
            expect(input).toHaveAttribute("aria-expanded", "false");
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("cancels a debounced search when focus leaves the box before it fires", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch(
                <>
                    <HeaderSearch />
                    <button type="button">Elsewhere</button>
                </>
            );

            await user.type(input, "PO-TEST");
            await user.click(screen.getByRole("button", { name: "Elsewhere" }));
            await new Promise((resolve) => setTimeout(resolve, 450));

            expect(requests).toHaveLength(0);
            expect(input).toHaveAttribute("aria-expanded", "false");
        });

        it("drops stale rows when focus leaves mid-search, so refocusing can't open an old result", async () => {
            const requests = mockSearch((q) => ({ data: q === "PO-TEST" ? [PO_1] : [PO_2], count: 1 }));
            const { user, input } = renderSearch(
                <>
                    <HeaderSearch />
                    <button type="button">Elsewhere</button>
                </>
            );

            await user.type(input, "PO-TEST");
            await screen.findByRole("option", { name: /Child Care Study/ });
            await user.type(input, "X");
            await user.click(screen.getByRole("button", { name: "Elsewhere" }));
            await new Promise((resolve) => setTimeout(resolve, 450));
            await user.click(input);
            await user.keyboard("{ArrowDown}");

            expect(requests).toEqual(["PO-TEST"]);
            expect(input).toHaveValue("PO-TESTX");
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("does not reopen the dropdown when a response arrives after Esc", async () => {
            const requests = mockSearch(async () => {
                await delay(300);
                return { data: [PO_1], count: 1 };
            });
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            await waitFor(() => expect(requests).toHaveLength(1), { timeout: 5000 });
            await user.keyboard("{Escape}");
            await new Promise((resolve) => setTimeout(resolve, 500));

            expect(input).toHaveValue("");
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });
    });

    describe("keyboard and mouse", () => {
        it("navigates to the agreement when a row is clicked", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            await user.click(await screen.findByRole("option", { name: /Head Start Study/ }));

            expect(location()).toBe("/agreements/12");
            // The header stays mounted when moving between agreements, so the box must clear itself.
            expect(input).toHaveValue("");
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("keeps focus in the input when the mouse goes down on a row, so the click can land", async () => {
            mockSearch();
            const { user, input } = renderSearch();
            await user.type(input, "PO-TEST");
            const option = await screen.findByRole("option", { name: /Head Start Study/ });

            await user.pointer({ keys: "[MouseLeft>]", target: option });

            expect(input).toHaveFocus();
            expect(screen.getAllByRole("option")).toHaveLength(2);
        });

        it("moves the active option with ArrowDown/ArrowUp and updates aria-activedescendant", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            const [first, second] = await screen.findAllByRole("option");

            await user.keyboard("{ArrowDown}");
            expect(input).toHaveAttribute("aria-activedescendant", first.id);
            expect(first).toHaveAttribute("aria-selected", "true");

            await user.keyboard("{ArrowDown}{ArrowDown}");
            expect(input).toHaveAttribute("aria-activedescendant", second.id);

            await user.keyboard("{ArrowUp}");
            expect(input).toHaveAttribute("aria-activedescendant", first.id);

            await user.keyboard("{ArrowUp}");
            expect(input).not.toHaveAttribute("aria-activedescendant");
            expect(input).toHaveFocus();
        });

        it("Enter on a highlighted row opens the agreement and does not also go to /search", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

            expect(location()).toBe("/agreements/12");
            expect(input).toHaveValue("");
        });

        it("Enter with no highlighted row goes to the results page", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.keyboard("{Enter}");

            expect(location()).toBe("/search?q=PO-TEST");
        });

        it("Enter before any results arrive goes to the results page, encoding special characters", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "  A&B #1 ");
            await user.keyboard("{Enter}");

            expect(location()).toBe("/search?q=A%26B+%231");
        });

        it("clicking the magnifier goes to the results page", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "head start");
            await user.click(screen.getByRole("button", { name: "Search" }));

            expect(location()).toBe("/search?q=head+start");
        });

        it("does nothing when submitting an empty box", async () => {
            const { user, input } = renderSearch();

            await user.click(input);
            await user.keyboard("{Enter}");

            expect(location()).toBe("/");
        });

        it("ignores Escape and Enter while an IME composition is in progress", async () => {
            mockSearch();
            const { user, input } = renderSearch();
            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.keyboard("{ArrowDown}");

            // fireEvent-level keydown is required to set isComposing, which userEvent can't.
            fireEvent.keyDown(input, { key: "Escape", isComposing: true });
            fireEvent.keyDown(input, { key: "Enter", isComposing: true });

            expect(input).toHaveValue("PO-TEST");
            expect(location()).toBe("/");
        });

        it("Esc closes the dropdown and clears the input", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.keyboard("{Escape}");

            expect(input).toHaveValue("");
            expect(input).toHaveAttribute("aria-expanded", "false");
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("the clear button resets the search and refocuses the input", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.click(screen.getByRole("button", { name: "Clear search" }));

            expect(input).toHaveValue("");
            expect(input).toHaveFocus();
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
        });

        it("closes the dropdown when focus leaves the search", async () => {
            mockSearch();
            const { user, input } = renderSearch(
                <>
                    <HeaderSearch />
                    <button type="button">Elsewhere</button>
                </>
            );

            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.tab(); // clear button, still inside the component
            expect(input).toHaveAttribute("aria-expanded", "true");
            await user.click(screen.getByRole("button", { name: "Elsewhere" }));

            expect(input).toHaveAttribute("aria-expanded", "false");
        });
    });

    describe("content", () => {
        it("shows ODN and nickname lines, highlights the match, and a footer with the count", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "po-test-0001");
            const options = await screen.findAllByRole("option");

            expect(options[0]).toHaveTextContent("Child Care Study");
            expect(options[0]).toHaveTextContent("Contract");
            expect(options[0]).toHaveTextContent("ODN: PO-TEST-0001 · Nickname: CCS");
            expect(options[0].querySelector("mark")).toHaveTextContent("PO-TEST-0001");
            // No nickname: the secondary line has the ODN only.
            expect(options[1]).not.toHaveTextContent("Nickname");
            expect(document.querySelector("[data-cy=header-search-footer]")).toHaveTextContent(
                "2 results · Press Enter to see all"
            );
        });

        it("uses the singular for one result", async () => {
            mockSearch(() => ({ data: [PO_1], count: 1 }));
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST-0001");

            await screen.findByRole("option");
            expect(document.querySelector("[data-cy=header-search-footer]")).toHaveTextContent(
                "1 result · Press Enter to see all"
            );
        });

        it("shows the true total in the footer when there are more matches than rows", async () => {
            mockSearch(() => ({ data: [PO_1, PO_2], count: 37 }));
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");

            await screen.findAllByRole("option");
            expect(document.querySelector("[data-cy=header-search-footer]")).toHaveTextContent("37 results ·");
        });

        it("shows a hint when nothing matches", async () => {
            mockSearch(() => ({ data: [], count: 0 }));
            const { user, input } = renderSearch();

            await user.type(input, "zzz");

            expect(await screen.findByText(/No agreements match "zzz"\./)).toBeInTheDocument();
            expect(screen.getByText(/Try an ODN, agreement title, or nickname\./)).toBeInTheDocument();
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
            expect(screen.getByRole("status")).toHaveTextContent("No results");
        });

        it("shows an error row, and Enter then opens the results page", async () => {
            mockSearch(() => new Response(null, { status: 500 }));
            const { user, input } = renderSearch();
            vi.spyOn(console, "error").mockImplementation(() => {});

            await user.type(input, "PO-TEST");

            await waitFor(() => expect(document.querySelector("[data-cy=header-search-error]")).toBeInTheDocument());
            expect(screen.queryByRole("option")).not.toBeInTheDocument();

            await user.keyboard("{Enter}");
            expect(location()).toBe("/search?q=PO-TEST");
        });

        it("pre-fills from the q param on /search only", () => {
            const { input } = renderSearch(<HeaderSearch />, "/search?q=PO-TEST");
            expect(input).toHaveValue("PO-TEST");
        });

        it("does not pre-fill on other pages", () => {
            const { input } = renderSearch(<HeaderSearch />, "/agreements?q=PO-TEST");
            expect(input).toHaveValue("");
        });

        it("drops the dropdown and pending search when Back/Forward changes the q param", async () => {
            const requests = mockSearch();
            const GoBack = () => {
                const navigate = useNavigate();
                return <button onClick={() => navigate("/search?q=Other")}>go</button>;
            };
            const { user, input } = renderSearch(
                <>
                    <HeaderSearch />
                    <GoBack />
                </>,
                "/search?q=PO-TEST"
            );

            await user.type(input, "{Backspace}X");
            await screen.findAllByRole("option");
            await user.type(input, "Y");
            fireEvent.click(screen.getByRole("button", { name: "go" }));

            await waitFor(() => expect(input).toHaveValue("Other"));
            await new Promise((resolve) => setTimeout(resolve, 450));
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
            expect(requests).not.toContain("PO-TESXY");
        });

        it("replaces the history entry when searching from /search", async () => {
            mockSearch();
            const { user, input } = renderSearch(<HeaderSearch />, "/search?q=PO-TEST");

            await user.clear(input);
            await user.type(input, "Head{Enter}");

            expect(location()).toBe("/search?q=Head");
        });
    });

    describe("in the Header", () => {
        const renderHeader = (auth) => {
            const store = setupStore({ auth });
            render(
                <Provider store={store}>
                    <MemoryRouter>
                        <Header />
                    </MemoryRouter>
                </Provider>
            );
        };

        it("renders when logged in", () => {
            renderHeader({ isLoggedIn: true, activeUser: { id: 1, roles: [] } });
            expect(screen.getByRole("combobox", { name: "Search agreements" })).toBeInTheDocument();
        });

        it("does not render when logged out", () => {
            renderHeader({ isLoggedIn: false, activeUser: null });
            expect(screen.queryByRole("combobox", { name: "Search agreements" })).not.toBeInTheDocument();
            expect(screen.queryByRole("search")).not.toBeInTheDocument();
        });
    });
});
