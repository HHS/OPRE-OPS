import { renderWithProviders } from "../test-utils";
import { screen } from "@testing-library/react";
import ErrorPage from "./ErrorPage";

describe("ErrorPage", () => {
    it("should render the error heading", () => {
        renderWithProviders(<ErrorPage />);
        expect(screen.getByRole("heading", { name: /Something went wrong/i })).toBeInTheDocument();
    });

    it("should render the error description", () => {
        renderWithProviders(<ErrorPage />);
        expect(screen.getByText(/had its name changed, or is temporarily unavailable/i)).toBeInTheDocument();
    });

    it("should render the URL example", () => {
        renderWithProviders(<ErrorPage />);
        expect(screen.getByText(/<https:\/\/ops.opre.acf.gov\/example-one>/i)).toBeInTheDocument();
    });

    it("should mention the Help Center", () => {
        renderWithProviders(<ErrorPage />);
        expect(screen.getByText(/Visit our/i)).toBeInTheDocument();
    });

    it("should mention submitting a Budget Support Request", () => {
        renderWithProviders(<ErrorPage />);
        expect(screen.getByText(/If you continue to experience this issue, please/i)).toBeInTheDocument();
    });

    it("should render instructions for checking URL spelling", () => {
        renderWithProviders(<ErrorPage />);
        expect(
            screen.getByText(/If you typed the URL directly, check your spelling and capitalization/i)
        ).toBeInTheDocument();
    });
});
