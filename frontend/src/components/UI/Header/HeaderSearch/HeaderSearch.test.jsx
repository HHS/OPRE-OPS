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
const PO_3 = { id: 13, name: "Third Study", nick_name: "THIRD-NICK", agreement_type: "GRANT", odn: null };

const LocationProbe = () => {
    const { pathname, search } = useLocation();
    return <div data-testid="location">{`${pathname}${search}`}</div>;
};

/** Registers a handler that records each request's q and answers with `respond(q)`. */
const mockSearch = (respond = () => ({ data: [PO_1, PO_2], count: 2 }), calls = []) => {
    const requests = [];
    server.use(
        http.get("*/api/v1/agreements-search/", async ({ request }) => {
            const searchParams = new URL(request.url).searchParams;
            const q = searchParams.get("q");
            requests.push(q);
            calls.push(Object.fromEntries(searchParams));
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
    const { unmount } = render(
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
    return { user, store, unmount, input: screen.getByRole("combobox", { name: "Search agreements" }) };
};

// 300ms debounce + MSW latency can exceed the 1000ms default on a loaded CI runner.
configure({ asyncUtilTimeout: 5000 });

const location = () => screen.getByTestId("location").textContent;

const withElsewhere = (
    <>
        <HeaderSearch />
        <button type="button">Elsewhere</button>
    </>
);
const clickElsewhere = (user) => user.click(screen.getByRole("button", { name: "Elsewhere" }));
const findErrorRow = () =>
    waitFor(() => {
        const row = document.querySelector("[data-cy=header-search-error]");
        expect(row).toBeInTheDocument();
        return row;
    });
// Real-time wait used only to prove that something does NOT happen: it must outlast the 300ms debounce
// (plus request latency), otherwise an absence assertion would pass before the request could ever be sent.
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
            expect(input).toHaveAttribute("autocomplete", "off");
            expect(input).toHaveAttribute("maxlength", "100");
            // The magnifier is decorative: the button's aria-label names it.
            expect(screen.getByRole("button", { name: "Search" }).querySelector("svg")).toHaveAttribute(
                "aria-hidden",
                "true"
            );
            // Nothing to show yet: the whole dropdown is hidden, not just emptied.
            expect(listbox.parentElement).not.toBeVisible();
        });

        it("expands and lists options once results arrive", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");

            expect(await screen.findAllByRole("option")).toHaveLength(2);
            expect(input).toHaveAttribute("aria-expanded", "true");
            expect(screen.getByRole("status")).toHaveTextContent("2 results");
            expect(screen.getByRole("listbox", { name: "Matching agreements" })).toBeVisible();
        });

        it("announces a single result in the singular", async () => {
            mockSearch(() => ({ data: [PO_1], count: 1 }));
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST-0001");

            await screen.findByRole("option");
            expect(screen.getByRole("status")).toHaveTextContent(/^1 result$/);
        });

        it("marks the listbox busy only while a search is in flight", async () => {
            mockSearch(async () => {
                await delay(200);
                return { data: [PO_1], count: 1 };
            });
            const { user, input } = renderSearch();
            const listbox = screen.getByRole("listbox", { hidden: true });
            expect(listbox).toHaveAttribute("aria-busy", "false");

            await user.type(input, "PO-TEST");
            expect(listbox).toHaveAttribute("aria-busy", "true");

            await screen.findByRole("option");
            expect(listbox).toHaveAttribute("aria-busy", "false");
        });

        it("keeps aria-expanded false and exposes no listbox when the dropdown only holds the empty hint", async () => {
            mockSearch(() => ({ data: [], count: 0 }));
            const { user, input } = renderSearch();

            await user.type(input, "zzz");

            const hint = await screen.findByText(/No agreements match/);
            expect(hint).toBeVisible();
            expect(input).toHaveAttribute("aria-expanded", "false");
            expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        });

        it("announces and shows the error row, with aria-expanded false", async () => {
            mockSearch(() => new Response(null, { status: 500 }));
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");

            const error = await findErrorRow();
            expect(error).toBeVisible();
            expect(error).toHaveTextContent("Search is unavailable. Press Enter to try again.");
            expect(screen.getByRole("status")).toHaveTextContent("Search is unavailable. Press Enter to try again.");
            expect(input).toHaveAttribute("aria-expanded", "false");
            expect(consoleError).toHaveBeenCalledWith("Agreement search failed", expect.anything());
            consoleError.mockRestore();
        });

        it("drops the active descendant once focus leaves, so it never points into a hidden list", async () => {
            mockSearch();
            const { user, input } = renderSearch(withElsewhere);
            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.keyboard("{ArrowDown}");
            expect(input).toHaveAttribute("aria-activedescendant");

            await clickElsewhere(user);

            expect(input).toHaveAttribute("aria-expanded", "false");
            expect(input).not.toHaveAttribute("aria-activedescendant");
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

        it("asks for five rows from the start and re-queries when the same text is searched again", async () => {
            const calls = [];
            mockSearch(undefined, calls);
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            expect(calls).toEqual([{ q: "PO-TEST", limit: "5", offset: "0" }]);

            await user.clear(input);
            await user.type(input, "PO-TEST");

            // A cached answer for the same text must not be reused: results can change server-side.
            await waitFor(() => expect(calls).toHaveLength(2));
        });

        it("searches for the trimmed text and ignores a single character padded with spaces", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "a ");
            await pause(450);
            expect(requests).toHaveLength(0);

            await user.clear(input);
            await user.type(input, "  PO-TEST  ");
            await screen.findAllByRole("option");
            expect(requests).toEqual(["PO-TEST"]);
        });

        it("caps pasted text at 100 characters", () => {
            const { input } = renderSearch();

            fireEvent.change(input, { target: { value: "x".repeat(150) } });

            expect(input).toHaveValue("x".repeat(100));
        });

        it("cancels a debounced search when the header unmounts before it fires", async () => {
            const requests = mockSearch();
            const { user, input, unmount } = renderSearch();

            await user.type(input, "PO-TEST");
            unmount();
            await pause(450);

            expect(requests).toHaveLength(0);
        });

        it("cancels a debounced search when the form is submitted before it fires", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST{Enter}");
            await pause(450);

            expect(location()).toBe("/search?q=PO-TEST");
            expect(requests).toHaveLength(0);
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("cancels a pending search when resubmitting the query already in the URL", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch(<HeaderSearch />, "/search?q=PO-TEST");

            // Back to the very text the URL holds: no URL change follows the submit to reset anything.
            await user.type(input, "{Backspace}T{Enter}");
            await pause(450);

            expect(location()).toBe("/search?q=PO-TEST");
            expect(requests).toHaveLength(0);
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("does not search below 2 characters", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "a");
            await pause(450);

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
            await pause(1000);
            expect(screen.queryByText(/STALE RESULT/)).not.toBeInTheDocument();
            expect(requests).toEqual(["ab", "abc"]);
        });

        it("cancels a pending search when the input is cleared", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch();

            await user.type(input, "PO");
            await user.clear(input);
            await pause(450);

            expect(requests).toHaveLength(0);
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("does not reopen the dropdown when a response arrives after focus leaves the box", async () => {
            const requests = mockSearch(async () => {
                await delay(300);
                return { data: [PO_1], count: 1 };
            });
            const { user, input } = renderSearch(withElsewhere);

            await user.type(input, "PO-TEST");
            await waitFor(() => expect(requests).toHaveLength(1), { timeout: 5000 });
            await clickElsewhere(user);
            await pause(500);

            expect(input).not.toHaveFocus();
            expect(input).toHaveAttribute("aria-expanded", "false");
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("cancels a debounced search when focus leaves the box before it fires", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch(withElsewhere);

            await user.type(input, "PO-TEST");
            await clickElsewhere(user);
            await pause(450);

            expect(requests).toHaveLength(0);
            expect(input).toHaveAttribute("aria-expanded", "false");
        });

        it("drops stale rows when focus leaves mid-search, so refocusing can't open an old result", async () => {
            const requests = mockSearch((q) => ({ data: q === "PO-TEST" ? [PO_1] : [PO_2], count: 1 }));
            const { user, input } = renderSearch(withElsewhere);

            await user.type(input, "PO-TEST");
            await screen.findByRole("option", { name: /Child Care Study/ });
            await user.type(input, "X");
            await clickElsewhere(user);
            await pause(450);
            await user.click(input);
            await user.keyboard("{ArrowDown}");

            expect(requests).toEqual(["PO-TEST"]);
            expect(input).toHaveValue("PO-TESTX");
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
        });

        it("clears the busy flag when focus leaves mid-search", async () => {
            mockSearch();
            const { user, input } = renderSearch(withElsewhere);

            await user.type(input, "PO-TEST");
            await clickElsewhere(user);

            expect(screen.getByRole("listbox", { hidden: true })).toHaveAttribute("aria-busy", "false");
            expect(input).toHaveAttribute("aria-expanded", "false");
        });

        it("reopens the same results when focus returns to the box", async () => {
            const requests = mockSearch();
            const { user, input } = renderSearch(withElsewhere);
            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");

            await clickElsewhere(user);
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
            await user.click(input);

            expect(await screen.findAllByRole("option")).toHaveLength(2);
            expect(input).toHaveAttribute("aria-expanded", "true");
            expect(requests).toEqual(["PO-TEST"]);
        });

        it("reopens the empty hint and the error row when focus returns to the box", async () => {
            mockSearch((q) => (q === "zzz" ? { data: [], count: 0 } : new Response(null, { status: 500 })));
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
            const { user, input } = renderSearch(withElsewhere);

            await user.type(input, "zzz");
            const hint = await screen.findByText(/No agreements match/);
            await clickElsewhere(user);
            expect(hint).not.toBeVisible();
            await user.click(input);
            expect(hint).toBeVisible();

            await user.clear(input);
            await user.type(input, "boom");
            const error = await findErrorRow();
            await clickElsewhere(user);
            expect(error).not.toBeVisible();
            await user.click(input);
            expect(error).toBeVisible();
            consoleError.mockRestore();
        });

        it("forgets the results on Esc, so refocusing does not bring an old list back", async () => {
            mockSearch();
            const { user, input } = renderSearch(withElsewhere);
            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.keyboard("{Escape}");

            await clickElsewhere(user);
            await user.click(input);

            expect(input).toHaveValue("");
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
            expect(input).toHaveAttribute("aria-expanded", "false");
        });

        it("forgets the empty hint on Esc, so refocusing does not bring it back", async () => {
            mockSearch(() => ({ data: [], count: 0 }));
            const { user, input } = renderSearch(withElsewhere);
            await user.type(input, "zzz");
            await screen.findByText(/No agreements match/);
            await user.keyboard("{Escape}");

            await clickElsewhere(user);
            await user.click(input);

            expect(screen.queryByText(/No agreements match/)).not.toBeInTheDocument();
            expect(screen.getByRole("status")).toBeEmptyDOMElement();
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
            await pause(500);

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

        it("clamps ArrowUp at no highlight, so the next ArrowDown lands on the first row", async () => {
            mockSearch();
            const { user, input } = renderSearch();
            await user.type(input, "PO-TEST");
            const [first] = await screen.findAllByRole("option");

            await user.keyboard("{ArrowUp}{ArrowUp}{ArrowDown}");

            expect(input).toHaveAttribute("aria-activedescendant", first.id);
        });

        it("Enter on the first highlighted row opens it", async () => {
            mockSearch();
            const { user, input } = renderSearch();
            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");

            await user.keyboard("{ArrowDown}{Enter}");

            expect(location()).toBe("/agreements/11");
        });

        it("only swallows arrow keys when there is a list to move through", async () => {
            mockSearch();
            const { user, input } = renderSearch();

            // fireEvent returns false when the keydown was default-prevented.
            expect(fireEvent.keyDown(input, { key: "ArrowDown" })).toBe(true);
            expect(fireEvent.keyDown(input, { key: "ArrowUp" })).toBe(true);

            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            expect(fireEvent.keyDown(input, { key: "ArrowDown" })).toBe(false);
            expect(fireEvent.keyDown(input, { key: "ArrowUp" })).toBe(false);
        });

        it("does not swallow ArrowDown when only the empty hint is showing", async () => {
            mockSearch(() => ({ data: [], count: 0 }));
            const { user, input } = renderSearch();
            await user.type(input, "zzz");
            await screen.findByText(/No agreements match/);

            expect(fireEvent.keyDown(input, { key: "ArrowDown" })).toBe(true);
            expect(input).not.toHaveAttribute("aria-activedescendant");
        });

        it("prevents the browser's own submit so the page never reloads", () => {
            const { input } = renderSearch();

            expect(fireEvent.submit(input.closest("form"))).toBe(false);
        });

        it("takes over Enter from the form when a row is highlighted", async () => {
            mockSearch();
            const { user, input } = renderSearch();
            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.keyboard("{ArrowDown}");

            expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(false);
        });

        it("typing clears the highlighted row, so Enter searches instead of opening the old row", async () => {
            mockSearch();
            const { user, input } = renderSearch();
            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.keyboard("{ArrowDown}");
            expect(input).toHaveAttribute("aria-activedescendant");

            await user.type(input, "X");
            expect(input).not.toHaveAttribute("aria-activedescendant");
            await user.keyboard("{Enter}");

            expect(location()).toBe("/search?q=PO-TESTX");
        });

        it("Enter right after ArrowDown on stale rows searches the typed text instead of opening the old row", async () => {
            mockSearch();
            const { user, input } = renderSearch();
            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");

            await user.type(input, "X");
            await user.keyboard("{ArrowDown}{Enter}");

            expect(location()).toBe("/search?q=PO-TESTX");
        });

        it("a new response replaces the stale rows, which could not be highlighted while loading", async () => {
            mockSearch((q) => ({ data: q === "PO-TEST" ? [PO_1, PO_2] : [PO_3], count: q === "PO-TEST" ? 2 : 1 }));
            const { user, input } = renderSearch();
            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");

            await user.type(input, "X");
            // The debounce has not fired: the previous rows are still on screen but must not be highlightable.
            await user.keyboard("{ArrowDown}");
            expect(input).not.toHaveAttribute("aria-activedescendant");
            await screen.findByRole("option", { name: /Third Study/ });
            await user.keyboard("{ArrowDown}");
            expect(input).toHaveAttribute("aria-activedescendant");
            await user.keyboard("{ArrowUp}");

            expect(input).not.toHaveAttribute("aria-activedescendant");
            await user.keyboard("{Enter}");
            expect(location()).toBe("/search?q=PO-TESTX");
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

        it("adds a history entry when searching from another page", async () => {
            mockSearch();
            const GoBackOne = () => {
                const navigate = useNavigate();
                return <button onClick={() => navigate(-1)}>back</button>;
            };
            const { user, input } = renderSearch(
                <>
                    <HeaderSearch />
                    <GoBackOne />
                </>,
                "/agreements"
            );

            await user.type(input, "Head{Enter}");
            expect(location()).toBe("/search?q=Head");
            fireEvent.click(screen.getByRole("button", { name: "back" }));

            expect(location()).toBe("/agreements");
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
            const { user, input } = renderSearch(withElsewhere);

            await user.type(input, "PO-TEST");
            await screen.findAllByRole("option");
            await user.tab(); // clear button, still inside the component
            expect(input).toHaveAttribute("aria-expanded", "true");
            await clickElsewhere(user);

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

        it("highlights the match in the title and in the nickname", async () => {
            mockSearch(() => ({ data: [PO_1], count: 1 }));
            const { user, input } = renderSearch();

            await user.type(input, "child");
            expect((await screen.findByRole("option")).querySelector("mark")).toHaveTextContent("Child");

            await user.clear(input);
            await user.type(input, "ccs");
            await waitFor(() => expect(screen.getByRole("option").querySelector("mark")).toHaveTextContent("CCS"));
        });

        it("shows only the nickname line, without a stray ODN label or separator, when there is no ODN", async () => {
            mockSearch(() => ({ data: [PO_1, PO_2, PO_3], count: 3 }));
            const { user, input } = renderSearch();

            await user.type(input, "study");
            const options = await screen.findAllByRole("option");

            expect(options[2]).toHaveTextContent("Nickname: THIRD-NICK");
            expect(options[2]).not.toHaveTextContent("ODN");
            expect(options[2]).not.toHaveTextContent("·");
            expect(options[1]).toHaveTextContent("ODN: PO-TEST-0002");
            expect(options[1]).not.toHaveTextContent("·");
        });

        it("omits the secondary line when an agreement has neither ODN nor nickname", async () => {
            mockSearch(() => ({ data: [{ ...PO_3, nick_name: null }], count: 1 }));
            const { user, input } = renderSearch();

            await user.type(input, "third");

            const option = await screen.findByRole("option");
            expect(option).toHaveTextContent(/^Third StudyGrant$/);
        });

        it("quotes the trimmed text in the empty hint", async () => {
            mockSearch(() => ({ data: [], count: 0 }));
            const { user, input } = renderSearch();

            await user.type(input, "zzz  ");

            expect(await screen.findByText(/No agreements match "zzz"\./)).toBeInTheDocument();
        });

        it("falls back to the row count when the response has no total, and to an empty list when it has no rows", async () => {
            mockSearch((q) =>
                q === "PO-TEST" ? { data: [PO_1], count: undefined } : { count: undefined, data: undefined }
            );
            const { user, input } = renderSearch();

            await user.type(input, "PO-TEST");
            await screen.findByRole("option");
            expect(document.querySelector("[data-cy=header-search-footer]")).toHaveTextContent("1 result ·");

            await user.type(input, "X");
            expect(await screen.findByText(/No agreements match/)).toBeInTheDocument();
            expect(document.querySelector("[data-cy=header-search-error]")).not.toBeInTheDocument();
        });

        it("drops the previous rows when a later search fails", async () => {
            mockSearch((q) => (q === "PO-TEST" ? { data: [PO_1], count: 1 } : new Response(null, { status: 500 })));
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
            const { user, input } = renderSearch();
            await user.type(input, "PO-TEST");
            await screen.findByRole("option");

            await user.type(input, "X");

            await waitFor(() => expect(document.querySelector("[data-cy=header-search-error]")).toBeInTheDocument());
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
            consoleError.mockRestore();
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

        it("starts empty on /search without a q param", () => {
            const { input } = renderSearch(<HeaderSearch />, "/search");
            expect(input).toHaveValue("");
        });

        it("follows the URL back to an earlier query (A to B to A)", async () => {
            mockSearch();
            const Links = () => {
                const navigate = useNavigate();
                return (
                    <>
                        <button onClick={() => navigate("/search?q=B")}>to-b</button>
                        <button onClick={() => navigate("/search?q=A")}>to-a</button>
                    </>
                );
            };
            renderSearch(
                <>
                    <HeaderSearch />
                    <Links />
                </>,
                "/search?q=A"
            );
            const box = screen.getByRole("combobox", { name: "Search agreements" });

            fireEvent.click(screen.getByRole("button", { name: "to-b" }));
            await waitFor(() => expect(box).toHaveValue("B"));
            fireEvent.click(screen.getByRole("button", { name: "to-a" }));

            await waitFor(() => expect(box).toHaveValue("A"));
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
            await pause(450);
            expect(screen.queryByRole("option")).not.toBeInTheDocument();
            expect(requests).not.toContain("PO-TESXY");
        });

        it("replaces the history entry when searching from /search", async () => {
            mockSearch();
            const GoBackOne = () => {
                const navigate = useNavigate();
                return <button onClick={() => navigate(-1)}>back</button>;
            };
            const { user, input } = renderSearch(
                <>
                    <HeaderSearch />
                    <GoBackOne />
                </>,
                "/search?q=PO-TEST"
            );

            await user.clear(input);
            await user.type(input, "Head{Enter}");

            expect(location()).toBe("/search?q=Head");
            // Replaced, not pushed: the only history entry is the new search, so Back has nowhere to go.
            fireEvent.click(screen.getByRole("button", { name: "back" }));
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
