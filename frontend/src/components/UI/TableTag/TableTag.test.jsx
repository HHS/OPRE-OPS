import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TableTag from "./TableTag";

describe("TableTag - PLANNED_MOD status", () => {
    it("renders 'Planned Mod' label for PLANNED_MOD status", () => {
        render(<TableTag status="PLANNED_MOD" />);
        expect(screen.getByText("Planned Mod")).toBeInTheDocument();
    });

    it("renders 'Planned Mod' text (color is applied via className)", () => {
        render(<TableTag status="PLANNED_MOD" />);
        // Just verify we can find the tag by its label text
        expect(screen.getByText("Planned Mod")).toBeInTheDocument();
    });
});
