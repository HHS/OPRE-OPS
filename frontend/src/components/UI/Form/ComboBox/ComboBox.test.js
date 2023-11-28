import { render, fireEvent, screen } from "@testing-library/react";
import ComboBox from "./ComboBox";
import { vi } from "vitest";

describe("ComboBox", () => {
    const researchProjects = [
        { id: 1, title: "Project 1", description: "Description 1" },
        { id: 2, title: "Project 2", description: "Description 2" },
        { id: 3, title: "Project 3", description: "Description 3" }
    ];
    const mockSetSelectedProject = vi.fn();

    it("renders the component with the correct label", () => {
        render(
            <ComboBox
                namespace="test"
                data={researchProjects}
                selectedData={researchProjects[0]}
                setSelectedData={mockSetSelectedProject}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        render(
            <ComboBox
                namespace="test"
                data={researchProjects}
                selectedData={researchProjects[0]}
                setSelectedData={mockSetSelectedProject}
            />
        );

        const select = screen.getByText("Project 1");
        expect(select).toBeInTheDocument();
    });

    it("updates the selected option when an option is selected", () => {
        const setSelectedProject = vi.fn();
        const { getByText, container } = render(
            <ComboBox
                namespace="test"
                data={researchProjects}
                selectedData={researchProjects[0]}
                setSelectedData={setSelectedProject}
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
            <ComboBox
                namespace="test"
                data={researchProjects}
                selectedData={researchProjects[0]}
                setSelectedData={mockSetSelectedProject}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "Project 2" } });
        expect(input).toHaveValue("Project 2");
    });
});
