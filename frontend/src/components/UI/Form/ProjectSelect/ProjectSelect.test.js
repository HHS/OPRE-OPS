import { render, fireEvent, screen } from "@testing-library/react";
import ProjectSelect from "./ProjectSelect";

describe("ProjectSelect", () => {
    const researchProjects = [
        { id: 1, title: "Project 1", description: "Description 1" },
        { id: 2, title: "Project 2", description: "Description 2" },
        { id: 3, title: "Project 3", description: "Description 3" },
    ];
    const mockSetSelectedProject = jest.fn();
    const mockClearFunction = jest.fn();

    it("renders the component with the correct label", () => {
        render(
            <ProjectSelect
                researchProjects={researchProjects}
                setSelectedProject={mockSetSelectedProject}
                clearFunction={mockClearFunction}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        render(
            <ProjectSelect
                researchProjects={researchProjects}
                setSelectedProject={mockSetSelectedProject}
                clearFunction={mockClearFunction}
            />
        );
        const select = screen.getByTestId("project-select");
        expect(select).toBeInTheDocument();
        expect(select).toHaveValue("1");
        expect(select).toHaveTextContent("Project 1");
        expect(select).toHaveTextContent("Project 2");
        expect(select).toHaveTextContent("Project 3");
    });

    it("updates the selected project when an option is selected", () => {
        const setSelectedProject = jest.fn();
        render(
            <ProjectSelect
                researchProjects={researchProjects}
                setSelectedProject={setSelectedProject}
                clearFunction={mockClearFunction}
            />
        );
        const select = screen.getByTestId("project-select");
        fireEvent.change(select, { target: { value: "2" } });
        expect(setSelectedProject).toHaveBeenCalledWith(researchProjects[1]);
    });

    it("updates the input value when the user types in the input field", () => {
        render(
            <ProjectSelect
                researchProjects={researchProjects}
                setSelectedProject={mockSetSelectedProject}
                clearFunction={mockClearFunction}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "Project 2" } });
        expect(input).toHaveValue("Project 2");
    });

    it("clears the input value when the clear button is clicked", () => {
        render(
            <ProjectSelect
                researchProjects={researchProjects}
                setSelectedProject={mockSetSelectedProject}
                clearFunction={mockClearFunction}
            />
        );
        const input = screen.getByTestId("project-input");
        const clearButton = screen.getByTestId("clear-input-button");
        fireEvent.change(input, { target: { value: "Project 2" } });
        fireEvent.click(clearButton);
        expect(mockClearFunction).toHaveBeenCalled();
    });
});
