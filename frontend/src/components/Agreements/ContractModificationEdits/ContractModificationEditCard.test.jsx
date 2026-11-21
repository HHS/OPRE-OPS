import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ContractModificationEditCard from "./ContractModificationEditCard";

vi.mock("../../../hooks/lookup.hooks", () => ({ useGetNameForCanId: () => "" }));

const periodEdit = (field, oldValue, newValue) => ({
    id: 1,
    modification_type: "MODIFIED_LOE",
    budget_line_item_id: null,
    services_component_id: 7,
    services_component_display_name: "SC2",
    field,
    old_value: oldValue,
    new_value: newValue,
    requested_by: { id: 521, full_name: "Basic User" },
    requested_on: "2026-11-18T12:00:00Z"
});

describe("ContractModificationEditCard — Services Component period of performance (OPS-3268)", () => {
    it.each([
        ["period_start", "PoP-Start", "2043-01-01", "2043-02-01", "January 1, 2043", "February 1, 2043"],
        ["period_end", "PoP-End", "2043-12-31", "2044-01-31", "December 31, 2043", "January 31, 2044"]
    ])("shows a %s edit as its own card: SC, %s, From/To dates", (field, changeTo, oldValue, newValue, from, to) => {
        render(<ContractModificationEditCard edit={periodEdit(field, oldValue, newValue)} />);

        expect(screen.getByText("SC2")).toBeInTheDocument();
        expect(screen.getByText(changeTo)).toBeInTheDocument();
        expect(screen.getByText(from)).toBeInTheDocument();
        expect(screen.getByText(to)).toBeInTheDocument();
        expect(screen.getByText("Modified Level of Effort")).toBeInTheDocument();
        expect(screen.queryByText("BL ID")).not.toBeInTheDocument();
    });

    it("shows TBD for a date that was or becomes empty", () => {
        render(<ContractModificationEditCard edit={periodEdit("period_end", null, "2044-01-31")} />);

        expect(screen.getByText("TBD")).toBeInTheDocument();
        expect(screen.getByText("January 31, 2044")).toBeInTheDocument();
    });
});
