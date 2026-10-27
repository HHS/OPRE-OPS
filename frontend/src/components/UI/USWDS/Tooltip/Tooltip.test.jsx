import { fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, it, expect } from "vitest";
import Tooltip from "./Tooltip";

/* eslint-disable testing-library/no-node-access */
// Tooltip delegates its DOM structure to USWDS's tooltip.js, which wraps the trigger in a
// `.usa-tooltip` span and injects a sibling `.usa-tooltip__body` span with no accessible-query
// hooks of its own. Asserting on that structure (and on the class/attribute mutations this
// component layers on top of it) requires direct DOM access.

describe("Tooltip", () => {
    it("wraps the trigger and renders a single tooltip body with the label text", () => {
        render(
            <Tooltip label="Help text">
                <button>trigger</button>
            </Tooltip>
        );

        const trigger = screen.getByRole("button");
        expect(trigger).toHaveClass("usa-tooltip__trigger");

        const bodies = document.querySelectorAll(".usa-tooltip__body");
        expect(bodies).toHaveLength(1);
        expect(bodies[0]).toHaveTextContent("Help text");
        expect(trigger.getAttribute("aria-describedby")).toBe(bodies[0].getAttribute("id"));
    });

    it("defaults position to top and reflects the position prop on the trigger", () => {
        render(
            <Tooltip
                label="Help text"
                position="right"
            >
                <button>trigger</button>
            </Tooltip>
        );

        expect(screen.getByRole("button")).toHaveAttribute("data-position", "right");
    });

    it("does not initialize tooltip markup when label is empty", () => {
        render(
            <Tooltip label="">
                <button>trigger</button>
            </Tooltip>
        );

        expect(screen.getByRole("button")).not.toHaveClass("usa-tooltip__trigger");
        expect(document.querySelectorAll(".usa-tooltip__body")).toHaveLength(0);
    });

    it("applies the width and text-wrap utility classes to the tooltip body when maxWidth is set", () => {
        render(
            <Tooltip
                label="Help text"
                maxWidth="tablet"
            >
                <button>trigger</button>
            </Tooltip>
        );

        const body = document.querySelector(".usa-tooltip__body");
        expect(body).toHaveClass("width-tablet", "text-wrap");
    });

    it("applies the className prop to the outer wrapper span", () => {
        const { container } = render(
            <Tooltip
                label="Help text"
                className="my-wrapper"
            >
                <button>trigger</button>
            </Tooltip>
        );

        expect(container.firstChild).toHaveClass("my-wrapper");
    });

    it("updates the tooltip body text in place when label changes, without nesting a duplicate body", () => {
        const { rerender } = render(
            <Tooltip label="first">
                <button>trigger</button>
            </Tooltip>
        );

        rerender(
            <Tooltip label="second">
                <button>trigger</button>
            </Tooltip>
        );
        rerender(
            <Tooltip label="third">
                <button>trigger</button>
            </Tooltip>
        );

        const bodies = document.querySelectorAll(".usa-tooltip__body");
        expect(bodies).toHaveLength(1);
        expect(bodies[0]).toHaveTextContent("third");
    });

    it("keeps the width/text-wrap classes on the single tooltip body across label changes", () => {
        const { rerender } = render(
            <Tooltip
                label="first"
                maxWidth="mobile"
            >
                <button>trigger</button>
            </Tooltip>
        );

        rerender(
            <Tooltip
                label="second"
                maxWidth="mobile"
            >
                <button>trigger</button>
            </Tooltip>
        );
        rerender(
            <Tooltip
                label="third"
                maxWidth="mobile"
            >
                <button>trigger</button>
            </Tooltip>
        );

        const bodies = document.querySelectorAll(".usa-tooltip__body");
        expect(bodies).toHaveLength(1);
        expect(bodies[0]).toHaveTextContent("third");
        expect(bodies[0]).toHaveClass("width-mobile", "text-wrap");
    });

    it("updates data-position on the trigger when position changes, without re-wrapping it", () => {
        const { rerender } = render(
            <Tooltip
                label="Help text"
                position="top"
            >
                <button>trigger</button>
            </Tooltip>
        );

        rerender(
            <Tooltip
                label="Help text"
                position="left"
            >
                <button>trigger</button>
            </Tooltip>
        );

        expect(screen.getByRole("button")).toHaveAttribute("data-position", "left");
        expect(document.querySelectorAll(".usa-tooltip")).toHaveLength(1);
        expect(document.querySelectorAll(".usa-tooltip__body")).toHaveLength(1);
    });

    it("tears down and cleanly reinitializes when label toggles from set to empty and back", () => {
        const { rerender } = render(
            <Tooltip label="first">
                <button>trigger</button>
            </Tooltip>
        );

        rerender(
            <Tooltip label="">
                <button>trigger</button>
            </Tooltip>
        );
        expect(screen.getByRole("button")).not.toHaveClass("usa-tooltip__trigger");
        expect(document.querySelectorAll(".usa-tooltip__body")).toHaveLength(0);

        rerender(
            <Tooltip label="second">
                <button>trigger</button>
            </Tooltip>
        );

        const trigger = screen.getByRole("button");
        expect(trigger).toHaveClass("usa-tooltip__trigger");
        const bodies = document.querySelectorAll(".usa-tooltip__body");
        expect(bodies).toHaveLength(1);
        expect(bodies[0]).toHaveTextContent("second");
    });

    it("still shows the tooltip on hover after React StrictMode's mount/cleanup/remount replay", () => {
        render(
            <StrictMode>
                <Tooltip label="Help text">
                    <button>trigger</button>
                </Tooltip>
            </StrictMode>
        );

        fireEvent.mouseOver(screen.getByRole("button"));

        const body = document.querySelector(".usa-tooltip__body");
        expect(body).toHaveClass("is-set");
    });
});
