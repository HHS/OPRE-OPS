import { render, screen } from "@testing-library/react";
import HeroDescription from "./HeroDescription";

describe("HeroDescription", () => {
    it("applies the line-height utility to every paragraph react-markdown generates from multi-paragraph markdown", () => {
        render(
            <HeroDescription
                label="Description"
                description={"First paragraph.\n\nSecond paragraph."}
            />
        );

        const firstParagraphs = screen.getAllByText("First paragraph.", { exact: false });
        const secondParagraphs = screen.getAllByText("Second paragraph....", { exact: false });

        expect(firstParagraphs.length).toBeGreaterThan(0);
        expect(secondParagraphs.length).toBeGreaterThan(0);

        [...firstParagraphs, ...secondParagraphs].forEach((paragraph) => {
            expect(paragraph.tagName).toBe("P");
            expect(paragraph).toHaveClass("line-height-body-4");
        });
    });
});
