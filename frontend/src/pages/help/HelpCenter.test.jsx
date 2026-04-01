import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import HelpCenter, { HELP_CENTER_EXPORT_URL } from "./HelpCenter";

vi.mock("../../App", () => ({
    default: ({ children }) => <div>{children}</div>
}));

vi.mock("../../components/UI/PageHeader", () => ({
    default: ({ title, subTitle }) => (
        <>
            <h1>{title}</h1>
            <p>{subTitle}</p>
        </>
    )
}));

vi.mock("../../components/UI/Tabs", () => ({
    default: ({ paths, rightContent }) => (
        <div>
            <nav aria-label="Tab Sections">
                {paths.map((path) => (
                    <span key={path.pathName}>{path.label}</span>
                ))}
            </nav>
            {rightContent}
        </div>
    )
}));

vi.mock("./FAQ", () => ({
    default: () => <div>FAQ Content</div>
}));

vi.mock("./Feedback", () => ({
    default: () => <div>Feedback Content</div>
}));

vi.mock("./Glossary", () => ({
    default: () => <div>Glossary Content</div>
}));

vi.mock("./HowToGuides", () => ({
    default: () => <div>How-To Guides Content</div>
}));

const renderWithRouter = (initialEntry = "/help-center") => {
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route
                    path="/help-center/*"
                    element={<HelpCenter />}
                />
            </Routes>
        </MemoryRouter>
    );
};

describe("HelpCenter", () => {
    it("renders the intro copy and export link", () => {
        renderWithRouter();

        expect(screen.getByRole("heading", { level: 1, name: "Help Center" })).toBeInTheDocument();
        expect(screen.getByText("OPS Guides & Information")).toBeInTheDocument();
        expect(
            screen.getByText(/Welcome to the Help Center - your go-to resource for assisting you in OPS\./i)
        ).toBeInTheDocument();

        const exportLink = screen.getByRole("link", { name: /export/i });
        expect(exportLink).toHaveAttribute("href", HELP_CENTER_EXPORT_URL);
        expect(exportLink).toHaveAttribute("target", "_blank");
        expect(exportLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the help center tabs and default route content", () => {
        renderWithRouter();

        expect(screen.getByText("How-to Guides")).toBeInTheDocument();
        expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
        expect(screen.getByText("Glossary")).toBeInTheDocument();
        expect(screen.getByText("Share Feedback")).toBeInTheDocument();
        expect(screen.getByText("How-To Guides Content")).toBeInTheDocument();
    });
});
