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
    project_start: "2043-06-13",
    project_end: "2045-06-13",
    division_directors: ["Dave Director", "Director Derrek"],
    research_methodologies: ["Descriptive Study", "Impact Study"],
    special_topics: ["Special Topic 1", "Special Topic 2"],
    project_officers: [
        { id: 503, name: "Amelia Popham" },
        { id: 500, name: "Chris Fortunato" }
    ],
    alternate_project_officers: [{ id: 522, name: "Dave Director" }],
    team_members: [
        { id: 503, full_name: "Amelia Popham", email: "amelia@example.com" },
        { id: 520, full_name: "System Owner", email: "system.owner@example.com" }
    ],
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
        expect(screen.getByText("Project Start")).toBeInTheDocument();
        expect(screen.getByText("Project End")).toBeInTheDocument();
        expect(screen.getByText("Research Methodologies")).toBeInTheDocument();
        expect(screen.getByText("Special Topic/Populations")).toBeInTheDocument();
        expect(screen.getByText("Division Director(s)")).toBeInTheDocument();
        expect(screen.getByText("Team Leader(s)")).toBeInTheDocument();
        expect(screen.getByText("COR")).toBeInTheDocument();
        expect(screen.getByText("Alternate COR")).toBeInTheDocument();
        expect(screen.getByText("Team Members")).toBeInTheDocument();
    });

    it("renders 'Research' tag for RESEARCH project type", () => {
        renderComponent(baseProject);
        expect(screen.getByText("Research")).toBeInTheDocument();
    });

    it("renders one tag per team leader", () => {
        const project = {
            ...baseProject,
            team_leaders: [
                { id: 500, full_name: "Chris Fortunato", email: "chris@example.com" },
                { id: 501, full_name: "Jane Smith", email: "jane@example.com" }
            ]
        };
        renderComponent(project);
        expect(screen.getAllByText("Chris Fortunato").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("renders project dates using the shared formatter", () => {
        renderComponent(baseProject);
        expect(screen.getByText("6/13/2043")).toBeInTheDocument();
        expect(screen.getByText("6/13/2045")).toBeInTheDocument();
    });

    it("renders TBD tags for empty collections", () => {
        renderComponent({
            ...baseProject,
            research_methodologies: [],
            special_topics: [],
            division_directors: [],
            team_leaders: [],
            project_officers: [],
            alternate_project_officers: [],
            team_members: []
        });
        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(7);
    });

    it("renders one tag per methodology when provided", () => {
        renderComponent({ ...baseProject, research_methodologies: ["Qualitative", "Quantitative"] });
        expect(screen.getByText("Qualitative")).toBeInTheDocument();
        expect(screen.getByText("Quantitative")).toBeInTheDocument();
    });

    it("renders one tag per special topic when provided", () => {
        renderComponent({ ...baseProject, special_topics: ["Children", "Families"] });
        expect(screen.getByText("Children")).toBeInTheDocument();
        expect(screen.getByText("Families")).toBeInTheDocument();
    });

    it("renders object-based methodologies, special topics, and division directors by name", () => {
        renderComponent({
            ...baseProject,
            research_methodologies: [
                { id: 1, name: "Qualitative" },
                { id: 2, name: "Quantitative" }
            ],
            special_topics: [
                { id: 3, name: "Children" },
                { id: 4, name: "Families" }
            ],
            division_directors: [
                { id: 5, name: "Dave Director" },
                { id: 6, name: "Director Derrek" }
            ]
        });

        expect(screen.getByText("Qualitative")).toBeInTheDocument();
        expect(screen.getByText("Quantitative")).toBeInTheDocument();
        expect(screen.getByText("Children")).toBeInTheDocument();
        expect(screen.getByText("Families")).toBeInTheDocument();
        expect(screen.getAllByText("Dave Director").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Director Derrek")).toBeInTheDocument();
    });

    it("renders division directors and team members", () => {
        renderComponent(baseProject);
        expect(screen.getAllByText("Dave Director").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Director Derrek")).toBeInTheDocument();
        expect(screen.getAllByText("Amelia Popham").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("System Owner")).toBeInTheDocument();
    });

    it("renders COR and Alternate COR values from the API response", () => {
        renderComponent(baseProject);

        expect(screen.getByText("COR")).toBeInTheDocument();
        expect(screen.getByText("Alternate COR")).toBeInTheDocument();
        expect(screen.getAllByText("Amelia Popham").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("Chris Fortunato").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("Dave Director").length).toBeGreaterThanOrEqual(1);
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

    it("renders TBD for missing scalar values", () => {
        renderComponent({
            ...baseProject,
            description: null,
            short_title: null,
            project_start: null,
            project_end: null
        });
        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(4);
    });
});
