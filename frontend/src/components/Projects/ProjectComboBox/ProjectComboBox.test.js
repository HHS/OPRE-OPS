import { render, fireEvent, screen } from "@testing-library/react";
import ProjectComboBox from "./ProjectComboBox";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

describe("ProjectReactSelect", () => {
    const researchProjects = [
        { id: 1, title: "Project 1", short_title: "P1", description: "Description 1" },
        { id: 2, title: "Project 2", short_title: "P2", description: "Description 2" },
        { id: 3, title: "Project 3", description: "Description 3" }
    ];
    const mockSetSelectedProject = mockFn;
    const mockClearFunction = mockFn;

    it("renders the component with the correct label", () => {
        render(
            <ProjectComboBox
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={mockSetSelectedProject}
                clearFunction={mockClearFunction}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Project")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        render(
            <ProjectComboBox
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={mockSetSelectedProject}
            />
        );

        const select = screen.getByText("Project 1 (P1)");
        expect(select).toBeInTheDocument();
    });

    it("updates the selected project when an option is selected", () => {
        const setSelectedProject = mockFn;
        const { getByText, container } = render(
            <ProjectComboBox
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={setSelectedProject}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Project 2 (P2)"));
        expect(setSelectedProject).toHaveBeenCalledWith(researchProjects[1]);
    });

    it("updates the input value when the user types in the input field", () => {
        render(
            <ProjectComboBox
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={mockSetSelectedProject}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "Project 2" } });
        expect(input).toHaveValue("Project 2");
    });

    it("uses title only when short_title is not provided", () => {
        render(
            <ProjectComboBox
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[2]}
                setSelectedProject={mockSetSelectedProject}
            />
        );

        expect(screen.getByText("Project 3")).toBeInTheDocument();
    });

    it("renders validation error message", () => {
        render(
            <ProjectComboBox
                researchProjects={researchProjects}
                selectedResearchProject={null}
                setSelectedProject={mockSetSelectedProject}
                messages={["This is required information"]}
            />
        );

        expect(screen.getByText("This is required information")).toBeInTheDocument();
    });

    it("renders required hint when field is marked required", () => {
        render(
            <ProjectComboBox
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={mockSetSelectedProject}
                label="Project Name"
                isRequired={true}
            />
        );

        expect(screen.getByText("Project Name")).toBeInTheDocument();
        expect(screen.getByText("Required Information*")).toBeInTheDocument();
    });
});
