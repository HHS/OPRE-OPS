import { render, fireEvent, screen } from "@testing-library/react";
import BLIStatusComboBox from "./BLIStatusComboBox";

describe("ProjectReactSelect", () => {
    const researchProjects = [
        { id: 1, title: "Project 1", description: "Description 1" },
        { id: 2, title: "Project 2", description: "Description 2" },
        { id: 3, title: "Project 3", description: "Description 3" },
    ];
    const mockSetSelectedProject = jest.fn();
    const mockClearFunction = jest.fn();

    it("renders the component with the correct label", () => {
        render(
            <BLIStatusComboBox
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={mockSetSelectedProject}
                clearFunction={mockClearFunction}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        render(
            <BLIStatusComboBox
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={mockSetSelectedProject}
            />
        );

        const select = screen.getByText("Project 1");
        expect(select).toBeInTheDocument();
    });

    it("updates the selected project when an option is selected", () => {
        const setSelectedProject = jest.fn();
        const { getByText, container } = render(
            <BLIStatusComboBox
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
        fireEvent.click(getByText("Project 2"));
        expect(setSelectedProject).toHaveBeenCalledWith(researchProjects[1]);
    });

    it("updates the input value when the user types in the input field", () => {
        render(
            <BLIStatusComboBox
                researchProjects={researchProjects}
                selectedResearchProject={researchProjects[0]}
                setSelectedProject={mockSetSelectedProject}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "Project 2" } });
        expect(input).toHaveValue("Project 2");
    });
});
