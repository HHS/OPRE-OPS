import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import WhatsNext from "./WhatsNext";

vi.mock("./WhatsNextTable", () => ({
    default: () => <div data-testid="whats-next-table">WhatsNextTable</div>
}));

describe("WhatsNext", () => {
    it("should render the heading", () => {
        render(<WhatsNext />);
        expect(screen.getByRole("heading", { name: /What's Next/i })).toBeInTheDocument();
    });

    it("should render the description", () => {
        render(<WhatsNext />);
        expect(
            screen.getByText(/This is a list of what upcoming features will be available in OPS soon/i)
        ).toBeInTheDocument();
    });

    it("should render the WhatsNextTable component", () => {
        render(<WhatsNext />);
        expect(screen.getByTestId("whats-next-table")).toBeInTheDocument();
    });
});
