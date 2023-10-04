import { render, screen } from "@testing-library/react";
import Accordion from "./Accordion";

describe("Accordion", () => {
    it("renders the heading and content", () => {
        render(
            <Accordion heading="Test Heading">
                <p>Test Content</p>
            </Accordion>
        );

        expect(screen.getByText("Test Heading")).toBeInTheDocument();
        expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("renders the heading with the correct level", () => {
        render(
            <Accordion
                heading="Test Heading"
                level={3}
            >
                <p>Test Content</p>
            </Accordion>
        );

        expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    });

    it("throws an error if the heading level is invalid", () => {
        expect(() =>
            render(
                <Accordion
                    heading="Test Heading"
                    level={7}
                >
                    <p>Test Content</p>
                </Accordion>
            )
        ).toThrowError("Unrecognized heading level: 7");
    });

    it("throws an error if the heading level is invalid", () => {
        expect(() =>
            render(
                <Accordion
                    heading="Test Heading"
                    level="button"
                >
                    <p>Test Content</p>
                </Accordion>
            )
        ).toThrowError("Unrecognized heading level: button");
    });
});
