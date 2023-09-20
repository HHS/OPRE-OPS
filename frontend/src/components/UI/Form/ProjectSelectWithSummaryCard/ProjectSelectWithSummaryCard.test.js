import { render, fireEvent } from "@testing-library/react";
import ProjectSelectWithSummaryCard from "./ProjectSelectWithSummaryCard";

describe("ProjectSelect", () => {
    const researchProjects = [
        { id: 1, title: "Project 1", description: "Description 1" },
        { id: 2, title: "Project 2", description: "Description 2" },
        { id: 3, title: "Project 3", description: "Description 3" }
    ];
    const mockClearFunction = jest.fn();

    it("updates the selected project when an option is selected and displays summary card", () => {
        const setSelectedProject = jest.fn();
        const { getByText, container } = render(
            <ProjectSelectWithSummaryCard
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={setSelectedProject}
                clearFunction={mockClearFunction}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Project 2"));
        expect(setSelectedProject).toHaveBeenCalledWith(researchProjects[1]);
    });
});
