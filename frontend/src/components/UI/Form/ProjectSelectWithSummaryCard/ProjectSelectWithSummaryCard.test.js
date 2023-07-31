import { render, fireEvent, screen } from "@testing-library/react";
import ProjectSelectWithSummaryCard from "./ProjectSelectWithSummaryCard";

describe("ProjectSelect", () => {
    const researchProjects = [
        { id: 1, title: "Project 1", description: "Description 1" },
        { id: 2, title: "Project 2", description: "Description 2" },
        { id: 3, title: "Project 3", description: "Description 3" },
    ];
    const mockClearFunction = jest.fn();

    it("updates the selected project when an option is selected and displays summary card", () => {
        const setSelectedProject = jest.fn();
        render(
            <ProjectSelectWithSummaryCard
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={setSelectedProject}
                clearFunction={mockClearFunction}
            />
        );
        const select = screen.getByTestId("project-select");
        fireEvent.change(select, { target: { value: "2" } });
        expect(setSelectedProject).toHaveBeenCalledWith(researchProjects[1]);
        expect(screen.getByTestId("project-summary-card")).toBeInTheDocument();
    });
});
