import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import GrantNumbersList from "./GrantNumbersList";

const mockFn = vi.fn();

describe("GrantNumbersList", () => {
    test("renders the empty-state message when there are no grant numbers", () => {
        render(
            <GrantNumbersList
                grantNumbers={[]}
                setFormDataById={mockFn}
                handleDelete={mockFn}
            />
        );

        expect(screen.getByText("You have not added any Grants Numbers yet.")).toBeInTheDocument();
    });

    test("renders grant numbers sorted ascending by number", () => {
        const grantNumbers = [
            { number: 3, display_title: "Grant 3", period_start: null, period_end: null, description: "" },
            { number: 1, display_title: "Grant 1", period_start: null, period_end: null, description: "" },
            { number: 2, display_title: "Grant 2", period_start: null, period_end: null, description: "" }
        ];

        render(
            <GrantNumbersList
                grantNumbers={grantNumbers}
                setFormDataById={mockFn}
                handleDelete={mockFn}
            />
        );

        const titles = screen.getAllByRole("heading", { level: 2 }).map((el) => el.textContent);
        expect(titles).toEqual(["Grant 1", "Grant 2", "Grant 3"]);
    });
});
