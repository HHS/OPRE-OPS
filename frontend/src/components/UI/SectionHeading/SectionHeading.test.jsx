import { render, screen } from "@testing-library/react";
import SectionHeading from "./SectionHeading";

/* eslint-disable testing-library/no-container, testing-library/no-node-access */
// Note: container.querySelector is necessary to assert on the instructions paragraph and the wrapper
// div's class names, neither of which is reachable through an accessible query.

describe("SectionHeading", () => {
    it("renders the title as a level 2 heading by default", () => {
        render(<SectionHeading title="OPS Release Summary" />);

        expect(screen.getByRole("heading", { level: 2, name: "OPS Release Summary" })).toBeInTheDocument();
    });

    it("renders the title at the requested heading level", () => {
        render(
            <SectionHeading
                title="Release Notes 1.0.0"
                level={3}
            />
        );

        expect(screen.getByRole("heading", { level: 3, name: "Release Notes 1.0.0" })).toBeInTheDocument();
    });

    it("renders instructions when provided", () => {
        render(
            <SectionHeading
                title="OPS Release Summary"
                instructions="A snapshot of the latest release."
            />
        );

        expect(screen.getByText("A snapshot of the latest release.")).toBeInTheDocument();
    });

    it("does not render a paragraph when instructions are omitted", () => {
        const { container } = render(<SectionHeading title="OPS Release Summary" />);

        expect(container.querySelector("p")).toBeNull();
    });

    it("applies additional class names and the Cypress hook", () => {
        const { container } = render(
            <SectionHeading
                title="OPS Release Summary"
                className="margin-top-4"
                dataCy="section-heading"
            />
        );

        const wrapper = container.querySelector("[data-cy='section-heading']");
        expect(wrapper).toHaveClass("margin-bottom-4", "margin-top-4");
    });

    it("throws for an unrecognized heading level", () => {
        expect(() =>
            render(
                <SectionHeading
                    title="Nope"
                    level={7}
                />
            )
        ).toThrow("Unrecognized heading level: 7");
    });
});
