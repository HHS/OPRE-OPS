import { render, screen } from "@testing-library/react";
import HeroDescription from "./HeroDescription";

describe("HeroDescription", () => {
    it("renders the description paragraph with the 24px line-height utility", () => {
        render(
            <HeroDescription
                label="Description"
                description="A short description of this portfolio."
            />
        );

        const paragraphs = screen.getAllByText("A short description of this portfolio....", { exact: false });
        expect(paragraphs.length).toBeGreaterThan(0);
        paragraphs.forEach((paragraph) => {
            expect(paragraph.tagName).toBe("P");
            expect(paragraph).toHaveClass("line-height-body-4");
        });
    });

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
