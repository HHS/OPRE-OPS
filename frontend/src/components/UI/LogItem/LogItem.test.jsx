import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import LogItem from "./LogItem";

const expectLinkPath = (link, expectedPath) => {
    const url = new URL(link.getAttribute("href"), window.location.origin);
    expect(`${url.pathname}${url.search}${url.hash}`).toBe(expectedPath);
};

const renderLogItem = (message) =>
    render(
        <MemoryRouter initialEntries={["/notifications"]}>
            <Routes>
                <Route
                    path="/notifications"
                    element={
                        <LogItem
                            title="Approval Request"
                            createdOn="2024-01-01"
                            message={message}
                        />
                    }
                />
                <Route
                    path="/agreements/approve/:id"
                    element={<div>Approve destination</div>}
                />
            </Routes>
        </MemoryRouter>
    );

describe("LogItem", () => {
    it("uses client-side routing for internal markdown links", async () => {
        expect.hasAssertions();
        const user = userEvent.setup();

        renderLogItem("[Open](/agreements/approve/9?type=status-change&to=executing)");

        const link = await screen.findByRole("link", { name: "Open" });

        expectLinkPath(link, "/agreements/approve/9?type=status-change&to=executing");

        await user.click(link);

        expect(await screen.findByText("Approve destination")).toBeInTheDocument();
    });

    it("keeps external markdown links as anchors", async () => {
        const user = userEvent.setup();
        renderLogItem("[Open](https://example.com/test)");

        const link = await screen.findByRole("link", { name: "Open" });

        expect(link).toHaveAttribute("href", "https://example.com/test");

        await user.click(link);

        expect(screen.queryByText("Approve destination")).not.toBeInTheDocument();
    });

    it("uses client-side routing for same-origin absolute markdown links", async () => {
        expect.hasAssertions();
        const user = userEvent.setup();

        renderLogItem(
            `[Open](${window.location.origin}/agreements/approve/9?type=status-change&to=executing)`
        );

        const link = await screen.findByRole("link", { name: "Open" });

        expectLinkPath(link, "/agreements/approve/9?type=status-change&to=executing");

        await user.click(link);

        expect(await screen.findByText("Approve destination")).toBeInTheDocument();
    });

    it("treats protocol-relative markdown links as external", async () => {
        renderLogItem("[Open](//example.com/test)");

        expect(await screen.findByRole("link", { name: "Open" })).toHaveAttribute("href", "//example.com/test");
    });
});
