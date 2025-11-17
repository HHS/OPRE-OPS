import { render, fireEvent, screen } from "@testing-library/react";
import ComboBox from "./ComboBox";
import TestApplicationContext from "../../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

describe("ComboBox", () => {
    const researchProjects = [
        { id: 1, title: "Project 1", description: "Description 1" },
        { id: 2, title: "Project 2", description: "Description 2" },
        { id: 3, title: "Project 3", description: "Description 3" }
    ];
    const mockSetSelectedProject = mockFn;

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
        const setSelectedProject = mockFn;
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

    it("should be enabled when isDisabled is false", () => {
        const { container } = render(
            <ComboBox
                namespace="test"
                data={researchProjects}
                selectedData={researchProjects[0]}
                setSelectedData={mockSetSelectedProject}
                isDisabled={false}
            />
        );
        // Check that the Select component is not disabled by looking at container class
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        const selectContainer = container.querySelector(".test__control");
        expect(selectContainer).not.toHaveClass("test__control--is-disabled");

        const input = screen.getByRole("combobox");
        expect(input).not.toBeDisabled();
    });

    it("should be disabled when isDisabled is true", () => {
        const { container } = render(
            <ComboBox
                namespace="test"
                data={researchProjects}
                selectedData={researchProjects[0]}
                setSelectedData={mockSetSelectedProject}
                isDisabled={true}
            />
        );

        // Check that the Select component is disabled by looking at container class
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        const selectContainer = container.querySelector(".test__control");
        expect(selectContainer).toHaveClass("test__control--is-disabled");

        // The input will still be accessible but disabled - look for it by role with hidden elements
        const input = screen.getByRole("combobox", { hidden: true });
        expect(input).toBeDisabled();
    });

    it("should be enabled when isDisabled is not provided (default behavior)", () => {
        render(
            <ComboBox
                namespace="test"
                data={researchProjects}
                selectedData={researchProjects[0]}
                setSelectedData={mockSetSelectedProject}
            />
        );

        const input = screen.getByRole("combobox");
        expect(input).not.toBeDisabled();
    });

    it("should handle isMulti with isDisabled", () => {
        const { container } = render(
            <ComboBox
                namespace="test"
                data={researchProjects}
                selectedData={[researchProjects[0]]}
                setSelectedData={mockSetSelectedProject}
                isMulti={true}
                isDisabled={true}
            />
        );

        // Check that the Select component is disabled by looking at container class
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        const selectContainer = container.querySelector(".test__control");
        expect(selectContainer).toHaveClass("test__control--is-disabled");

        // The input will still be accessible but disabled
        const input = screen.getByDisplayValue("");
        expect(input).toBeDisabled();
    });
});
