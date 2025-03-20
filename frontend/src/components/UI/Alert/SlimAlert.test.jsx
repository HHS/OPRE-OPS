import { render, screen } from "@testing-library/react";
import SlimAlert from "./SlimAlert";

describe("SlimAlert", () => {
    it("renders the message correctly", () => {
        const message = "Test alert message";
        render(
            <SlimAlert
                type="info"
                message={message}
            />
        );

        expect(screen.getByText(message)).toBeInTheDocument();
    });

    it.each([
        ["info", "usa-alert--info"],
        ["success", "usa-alert--success"],
        ["warning", "usa-alert--warning"],
        ["error", "usa-alert--error"],
        ["emergency", "usa-alert--emergency"]
    ])("applies correct class for %s type", (type, expectedClass) => {
        const message = "Test message";
        render(
            <SlimAlert
                type={type}
                message={message}
            />
        );

        const alertElement = screen.getByRole("alert");
        expect(alertElement).toHaveClass("usa-alert", "usa-alert--slim", expectedClass);
    });
});
