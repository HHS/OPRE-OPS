import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProjectDetailsView from "./ProjectDetailsView";

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual };
});

const baseProject = {
    id: 1000,
    title: "Human Services Interoperability Support",
    short_title: "HSS",
    description: "Interoperability activities description.",
    project_type: "RESEARCH",
    team_leaders: [{ id: 500, full_name: "Chris Fortunato", email: "chris.fortunato@example.com" }]
};

const renderComponent = (project) =>
    render(
        <MemoryRouter>
            <ProjectDetailsView project={project} />
        </MemoryRouter>
    );

describe("ProjectDetailsView", () => {
    it("renders a fallback message when project is null", () => {
        renderComponent(null);
        expect(screen.getByText("No project data.")).toBeInTheDocument();
    });

    it("renders the description and right-column labels", () => {
        renderComponent(baseProject);

        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Interoperability activities description.")).toBeInTheDocument();
        expect(screen.getByText("Project Nickname")).toBeInTheDocument();
        expect(screen.getByText("Project Type")).toBeInTheDocument();
        expect(screen.getByText("Methodologies")).toBeInTheDocument();
        expect(screen.getByText("Special Topic/Population Studied")).toBeInTheDocument();
        expect(screen.getByText("Project Officer")).toBeInTheDocument();
        expect(screen.getByText("Team Leaders")).toBeInTheDocument();
    });

    it("renders 'Research' tag for RESEARCH project type", () => {
        renderComponent(baseProject);
        expect(screen.getByText("Research")).toBeInTheDocument();
    });

    it("renders one tag per team member", () => {
        const project = {
            ...baseProject,
            team_leaders: [
                { id: 500, full_name: "Chris Fortunato", email: "chris@example.com" },
                { id: 501, full_name: "Jane Smith", email: "jane@example.com" }
            ]
        };
        renderComponent(project);
        expect(screen.getByText("Chris Fortunato")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("renders TBD tags for empty methodologies and populations", () => {
        renderComponent({ ...baseProject, methodologies: [], populations: [] });
        // TBD appears for methodologies, populations, and project officer — at least 3
        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(3);
    });

    it("renders one tag per methodology when provided", () => {
        renderComponent({ ...baseProject, methodologies: ["Qualitative", "Quantitative"] });
        expect(screen.getByText("Qualitative")).toBeInTheDocument();
        expect(screen.getByText("Quantitative")).toBeInTheDocument();
    });

    it("renders one tag per population when provided", () => {
        renderComponent({ ...baseProject, populations: ["Children", "Families"] });
        expect(screen.getByText("Children")).toBeInTheDocument();
        expect(screen.getByText("Families")).toBeInTheDocument();
    });

    it("renders History placeholder", () => {
        renderComponent(baseProject);
        expect(screen.getByText("History")).toBeInTheDocument();
        expect(screen.getByText("History coming soon.")).toBeInTheDocument();
    });

    it("renders 'Admin & Support' tag for ADMINISTRATIVE_AND_SUPPORT project type", () => {
        renderComponent({ ...baseProject, project_type: "ADMINISTRATIVE_AND_SUPPORT" });
        expect(screen.getByText("Admin & Support")).toBeInTheDocument();
    });

    it("renders TBD for missing description and short_title", () => {
        renderComponent({ ...baseProject, description: null, short_title: null });
        // NO_DATA ("TBD") appears for short_title, description, methodologies, populations, project officer
        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(2);
    });
});
