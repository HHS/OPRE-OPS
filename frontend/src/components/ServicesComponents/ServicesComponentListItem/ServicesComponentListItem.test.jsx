import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getServicesComponentChangeMessages, getServicesComponentLockedMessage } from "../ServicesComponents.helpers";
import ServicesComponentListItem from "./ServicesComponentListItem";

const TITLE = "This services component has pending edits that will require a contract modification:";

const changeRequest = (linkedIds) => ({
    requested_change_diff: { services_component_create: { old: null, new: "SC2" } },
    requested_change_info: { target_display_name: "SC2", linked_budget_line_item_ids: linkedIds }
});

describe("getServicesComponentLockedMessage (OPS-6440)", () => {
    it("lists a pending addition with its budget lines on one line", () => {
        const sc = { in_review: true, change_requests_in_review: [changeRequest([15012, 15013])] };

        expect(getServicesComponentLockedMessage(sc)).toBe(`${TITLE}\n • Adding: SC2 BL 15012, BL 15013`);
    });

    it("omits budget lines when the request lists none", () => {
        const sc = { in_review: true, change_requests_in_review: [changeRequest([])] };

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
        const lockedMessage = `${TITLE}\n \u2022 Adding: SC2 BL 15012`;
        renderItem({ lockedMessage });
        hoverItem();

        const [editButton, deleteButton] = screen.getAllByRole("button");
        expect(editButton).toBeDisabled();
        expect(deleteButton).toBeDisabled();
        expect(editButton).toHaveAttribute("aria-label", lockedMessage);
        expect(deleteButton).toHaveAttribute("aria-label", lockedMessage);
        expect(screen.queryByText("In Review")).not.toBeInTheDocument();
    });

    it("disables only delete, with the awarded-agreement tooltip, when the SC has budget lines on an awarded agreement", () => {
        renderItem({ isAwardedDeleteBlocked: true });
        hoverItem();

        const [editButton, deleteButton] = screen.getAllByRole("button");
        expect(editButton).toBeEnabled();
        expect(deleteButton).toBeDisabled();
        expect(deleteButton).toHaveAttribute(
            "aria-label",
            "Services Components with budget lines cannot be deleted on awarded agreements"
        );
    });

    it("shows the SC1 tooltip rather than the awarded one for the first services component", () => {
        renderItem({ number: 1, isAwardedDeleteBlocked: true });
        hoverItem();

        const [, deleteButton] = screen.getAllByRole("button");
        expect(deleteButton).toBeDisabled();
        expect(deleteButton).toHaveAttribute("aria-label", "All agreements must start with an SC1 or Base Period");
    });

    it("keeps edit and delete enabled when nothing is in review", () => {
        renderItem();
        hoverItem();

        const [editButton, deleteButton] = screen.getAllByRole("button");
        expect(editButton).toBeEnabled();
        expect(deleteButton).toBeEnabled();
    });
});

describe("getServicesComponentChangeMessages (OPS-6440)", () => {
    it("lists Services Component additions for the Changes In Review banner", () => {
        const changeRequests = [
            {
                has_services_component_change: true,
                requested_change_info: { target_display_name: "SC3" }
            },
            { has_proc_shop_change: true }
        ];

        expect(getServicesComponentChangeMessages(changeRequests)).toEqual(["SC3 Addition"]);
    });

    it("returns nothing without change requests", () => {
        expect(getServicesComponentChangeMessages(undefined)).toEqual([]);
    });
});
