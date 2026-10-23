import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getServicesComponentLockedMessage } from "../ServicesComponents.helpers";
import ServicesComponentListItem from "./ServicesComponentListItem";

const TITLE = "This services component has pending edits that will require a contract modification:";

const changeRequest = (kind, linkedIds) => ({
    requested_change_diff:
        kind === "add"
            ? { services_component_create: { old: null, new: "SC2" } }
            : { services_component_delete: { old: "SC2", new: "Deleted" } },
    requested_change_info: { target_display_name: "SC2", linked_budget_line_item_ids: linkedIds }
});

describe("getServicesComponentLockedMessage (OPS-6440)", () => {
    it("lists a pending addition with its budget lines on one line", () => {
        const sc = { in_review: true, change_requests_in_review: [changeRequest("add", [15012, 15013])] };

        expect(getServicesComponentLockedMessage(sc)).toBe(`${TITLE}\n • Adding: SC2 BL 15012, BL 15013`);
    });

    it("lists a pending deletion, with each budget line removed from the SC rather than deleted", () => {
        const sc = { in_review: true, change_requests_in_review: [changeRequest("delete", [15010, 15011])] };

        expect(getServicesComponentLockedMessage(sc)).toBe(
            `${TITLE}\n • Deleting: SC2\n • Removing: BL 15010 from SC2\n • Removing: BL 15011 from SC2`
        );
    });

    it("omits budget lines when the request lists none", () => {
        const sc = { in_review: true, change_requests_in_review: [changeRequest("add", [])] };

        expect(getServicesComponentLockedMessage(sc)).toBe(`${TITLE}\n • Adding: SC2`);
    });

    it("is empty when nothing is in review", () => {
        expect(getServicesComponentLockedMessage({ in_review: false, change_requests_in_review: null })).toBe("");
    });
});

describe("ServicesComponentListItem", () => {
    const renderItem = (props = {}) =>
        render(
            <ServicesComponentListItem
                id={2}
                number={2}
                title="Services Component 2"
                periodStart="2043-01-01"
                periodEnd="2043-12-31"
                description=""
                setFormDataById={vi.fn()}
                handleDelete={vi.fn()}
                {...props}
            />
        );

    // The icons only render on hover; mouseover on the title enters the item.
    const hoverItem = () => fireEvent.mouseOver(screen.getByText("Services Component 2"));

    it("disables edit and delete with the pending-change tooltip while a change is in review", () => {
        const lockedMessage = `${TITLE}\n \u2022 Deleting: SC2`;
        renderItem({ lockedMessage });
        hoverItem();

        const [editButton, deleteButton] = screen.getAllByRole("button");
        expect(editButton).toBeDisabled();
        expect(deleteButton).toBeDisabled();
        expect(editButton).toHaveAttribute("aria-label", lockedMessage);
        expect(deleteButton).toHaveAttribute("aria-label", lockedMessage);
        expect(screen.queryByText("In Review")).not.toBeInTheDocument();
    });

    it("keeps edit and delete enabled when nothing is in review", () => {
        renderItem();
        hoverItem();

        const [editButton, deleteButton] = screen.getAllByRole("button");
        expect(editButton).toBeEnabled();
        expect(deleteButton).toBeEnabled();
    });
});
