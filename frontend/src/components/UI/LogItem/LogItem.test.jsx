import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import LogItem from "./LogItem";

const expectLinkPath = (link, expectedPath) => {
    const url = new URL(link.getAttribute("href"), window.location.origin);
    expect(`${url.pathname}${url.search}${url.hash}`).toBe(expectedPath);
};

describe("LogItem", () => {
    it("uses client-side routing for internal markdown links", async () => {
        expect.hasAssertions();

        render(
            <MemoryRouter>
                <Routes>
                    <Route
                        path="*"
                        element={
                            <LogItem
                                title="Approval Request"
                                createdOn="2024-01-01"
                                message="[Open](/agreements/approve/9?type=status-change&to=executing)"
                            />
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expectLinkPath(
            await screen.findByRole("link", { name: "Open" }),
            "/agreements/approve/9?type=status-change&to=executing"
        );
    });

    it("keeps external markdown links as anchors", async () => {
        render(
            <MemoryRouter>
                <LogItem
                    title="Approval Request"
                    createdOn="2024-01-01"
                    message="[Open](https://example.com/test)"
                />
            </MemoryRouter>
        );

        expect(await screen.findByRole("link", { name: "Open" })).toHaveAttribute("href", "https://example.com/test");
    });

    it("uses client-side routing for same-origin absolute markdown links", async () => {
        expect.hasAssertions();

        render(
            <MemoryRouter>
                <Routes>
                    <Route
                        path="*"
                        element={
                            <LogItem
                                title="Approval Request"
                                createdOn="2024-01-01"
                                message="[Open](http://localhost:3000/agreements/approve/9?type=status-change&to=executing)"
                            />
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expectLinkPath(
            await screen.findByRole("link", { name: "Open" }),
            "/agreements/approve/9?type=status-change&to=executing"
        );
    });
});
