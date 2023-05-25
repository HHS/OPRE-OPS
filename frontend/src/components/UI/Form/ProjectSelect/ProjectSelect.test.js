import { render as rtlRender, fireEvent, screen, within } from "@testing-library/react";
import { createStore } from "redux";
import { Provider } from "react-redux";
import ProjectSelect from "./ProjectSelect";

function render(ui, store) {
    return rtlRender(<Provider store={store}>{ui}</Provider>);
}

describe("ProjectSelect component", () => {
    const mockResearchProjects = [
        { id: 1, title: "Project 1", description: "Description 1" },
        { id: 2, title: "Project 2", description: "Description 2" },
    ];

    const mockPropsSetSelectedProject = jest.fn();
    const mockClearFunction = jest.fn();

    const store = createStore(() => ({}));

    test("renders ProjectSelect component", () => {
        render(
            <ProjectSelect
                researchProjects={mockResearchProjects}
                propsSetSelectedProject={mockPropsSetSelectedProject}
                clearFunction={mockClearFunction}
            />,
            store
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    test("renders all project options", () => {
        render(
            <ProjectSelect
                researchProjects={mockResearchProjects}
                propsSetSelectedProject={mockPropsSetSelectedProject}
                clearFunction={mockClearFunction}
            />,
            store
        );
        const selectElement = screen.getByTestId("project-select");
        mockResearchProjects.forEach((project) => {
            expect(within(selectElement).getByText(project.title)).toBeInTheDocument();
        });
    });

    test("calls 'propsSetSelectedProject' when a project is selected", () => {
        render(
            <ProjectSelect
                researchProjects={mockResearchProjects}
                propsSetSelectedProject={mockPropsSetSelectedProject}
                clearFunction={mockClearFunction}
            />,
            store
        );
        const selectElement = screen.getByTestId("project-select");
        fireEvent.change(selectElement, { target: { value: "2" } });

        expect(mockPropsSetSelectedProject).toHaveBeenCalledTimes(1);
        expect(mockPropsSetSelectedProject).toHaveBeenCalledWith(mockResearchProjects[1]);
    });

    test("calls 'clearFunction' when clear button is clicked", () => {
        render(
            <ProjectSelect
                researchProjects={mockResearchProjects}
                propsSetSelectedProject={mockPropsSetSelectedProject}
                clearFunction={mockClearFunction}
            />,
            store
        );
        const clearButton = screen.getByTestId("clear-input-button");
        fireEvent.click(clearButton);

        expect(mockClearFunction).toHaveBeenCalledTimes(1);
    });
});
