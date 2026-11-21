import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
    getServicesComponentChangeMessages,
    getServicesComponentLockedMessage,
    SERVICES_COMPONENT_IN_REVIEW_MODIFICATION_MESSAGE
} from "../ServicesComponents.helpers";
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

    it("says why while its edits are in a contract modification in review (OPS-3268)", () => {
        expect(getServicesComponentLockedMessage({ in_review: false, in_review_modification: true })).toBe(
            SERVICES_COMPONENT_IN_REVIEW_MODIFICATION_MESSAGE
        );
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

    // The icons show on hover (they're always rendered, see the keyboard tests below); mouseover on
    // the title enters the item.
    const hoverItem = () => fireEvent.mouseOver(screen.getByText("Services Component 2"));

    it("disables edit and delete with the pending-change tooltip while a change is in review", () => {
        const lockedMessage = `${TITLE}\n \u2022 Adding: SC2 BL 15012`;
        renderItem({ lockedMessage });
        hoverItem();

        const [editButton, deleteButton] = screen.getAllByRole("button");
        expect(editButton).toHaveAttribute("aria-disabled", "true");
        expect(deleteButton).toHaveAttribute("aria-disabled", "true");
        expect(editButton).toHaveAccessibleName("Edit Services Component 2");
        expect(deleteButton).toHaveAccessibleName("Delete Services Component 2");
        // Accessible descriptions collapse whitespace.
        const description = lockedMessage.replace(/\s+/g, " ");
        expect(editButton).toHaveAccessibleDescription(description);
        expect(deleteButton).toHaveAccessibleDescription(description);
        expect(screen.queryByText("In Review")).not.toBeInTheDocument();
    });

    it("shows the SC1 tooltip for the first services component's delete", () => {
        renderItem({ number: 1 });
        hoverItem();

        const [, deleteButton] = screen.getAllByRole("button");
        expect(deleteButton).toHaveAttribute("aria-disabled", "true");
        expect(deleteButton).toHaveAccessibleName("Delete Services Component 2");
        expect(deleteButton).toHaveAccessibleDescription("All agreements must start with an SC1 or Base Period");
    });

    it("keeps edit and delete enabled when nothing is in review", () => {
        renderItem();
        hoverItem();

        const [editButton, deleteButton] = screen.getAllByRole("button");
        expect(editButton).toHaveAttribute("aria-disabled", "false");
        expect(deleteButton).toHaveAttribute("aria-disabled", "false");
    });

    it("keeps a locked item's edit and delete focusable (so the reason is reachable) but inert", async () => {
        const user = (await import("@testing-library/user-event")).default.setup();
        const setFormDataById = vi.fn();
        const handleDelete = vi.fn();
        renderItem({ lockedMessage: "Locked for review", setFormDataById, handleDelete });

        await user.tab();
        expect(screen.getByRole("button", { name: "Edit Services Component 2" })).toHaveFocus();
        await user.keyboard("{Enter}");
        await user.tab();
        await user.keyboard("{Enter}");

        expect(setFormDataById).not.toHaveBeenCalled();
        expect(handleDelete).not.toHaveBeenCalled();
    });

    it("lets keyboard users reach edit and delete: they're in the tab order and show on focus (WCAG 2.1.1)", async () => {
        const user = (await import("@testing-library/user-event")).default.setup();
        renderItem();
        const actions = screen.getByTestId("services-component-item-actions");
        expect(actions).toHaveStyle({ opacity: "0" });

        await user.tab();
        expect(screen.getByRole("button", { name: "Edit Services Component 2" })).toHaveFocus();
        expect(actions).toHaveStyle({ opacity: "1" });

        await user.tab();
        expect(screen.getByRole("button", { name: "Delete Services Component 2" })).toHaveFocus();
        expect(actions).toHaveStyle({ opacity: "1" });

        await user.tab();
        expect(actions).toHaveStyle({ opacity: "0" });
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
