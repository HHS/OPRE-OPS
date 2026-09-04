import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AlnNumbersComboBox from "./AlnNumbersComboBox";

describe("AlnNumbersComboBox", () => {
    const defaultProps = {
        selectedAlnNumbers: [],
        addAlnNumber: vi.fn()
    };

    it("renders all 10 real ALN number options when opened", () => {
        const { container } = render(<AlnNumbersComboBox {...defaultProps} />);

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        const expectedOptions = [
            "93.086 (HMRF)",
            "93.320 (MIECHV)",
            "93.493 (Congressionally Directed)",
            "93.575 (Head Start)",
            "93.591 (DV)",
            "93.595 (Welfare research)",
            "93.600 (Child Care)",
            "93.643 (Child Welfare)",
            "93.647 (SSRD)",
            "93.671 (FVPSA)"
        ];

        expectedOptions.forEach((aln) => {
            expect(screen.getByText(aln)).toBeInTheDocument();
        });
    });

    it("excludes already-selected options", () => {
        const { container } = render(
            <AlnNumbersComboBox
                selectedAlnNumbers={["93.086"]}
                addAlnNumber={vi.fn()}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.queryByText("93.086 (HMRF)")).not.toBeInTheDocument();
        expect(screen.getByText("93.600 (Child Care)")).toBeInTheDocument();
    });

    it("renders the ALN Numbers label", () => {
        render(<AlnNumbersComboBox {...defaultProps} />);
        expect(screen.getByText("ALN Numbers")).toBeInTheDocument();
    });
});
