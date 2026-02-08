import { render, fireEvent, screen } from "@testing-library/react";
import ProjectTitleComboBox from "./ProjectTitleComboBox";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

const sampleAgreementFilterOptions = {
    project_titles: [
        { id: 1, name: "Project Alpha" },
        { id: 2, name: "Project Beta" },
        { id: 3, name: "Project Gamma" }
    ]
};

describe("ProjectTitleComboBox", () => {
    const mockSetSelectedProjects = mockFn;

    it("renders the component with the correct label", () => {
        render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={mockSetSelectedProjects}
                agreementFilterOptions={sampleAgreementFilterOptions}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Project Title")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        const { container } = render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={mockSetSelectedProjects}
                agreementFilterOptions={sampleAgreementFilterOptions}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("Project Alpha")).toBeInTheDocument();
        expect(screen.getByText("Project Beta")).toBeInTheDocument();
        expect(screen.getByText("Project Gamma")).toBeInTheDocument();
    });

    it("updates the input value when the user types in the input field", () => {
        render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={mockSetSelectedProjects}
                agreementFilterOptions={sampleAgreementFilterOptions}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "Project Alpha" } });
        expect(input).toHaveValue("Project Alpha");
    });

    it("updates the selected item when multiple options are selected", () => {
        const setSelectedProjects = mockFn;
        const { getByText, container } = render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={setSelectedProjects}
                agreementFilterOptions={sampleAgreementFilterOptions}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Project Alpha"));
        expect(setSelectedProjects).toHaveBeenCalledWith([{ id: 1, title: "Project Alpha" }]);

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Project Beta"));
        expect(setSelectedProjects).toHaveBeenCalledWith([{ id: 2, title: "Project Beta" }]);
    });

    it("handles empty project_titles list", () => {
        const emptyOptions = {
            project_titles: []
        };
        render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={mockSetSelectedProjects}
                agreementFilterOptions={emptyOptions}
            />
        );

        expect(screen.getByText("Project Title")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles undefined agreementFilterOptions", () => {
        render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={mockSetSelectedProjects}
                agreementFilterOptions={undefined}
            />
        );

        expect(screen.getByText("Project Title")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles null project_titles", () => {
        const nullOptions = {
            project_titles: null
        };
        render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={mockSetSelectedProjects}
                agreementFilterOptions={nullOptions}
            />
        );

        expect(screen.getByText("Project Title")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders with custom legend class name", () => {
        render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={mockSetSelectedProjects}
                agreementFilterOptions={sampleAgreementFilterOptions}
                legendClassname="custom-legend-class"
            />
        );

        const label = screen.getByText("Project Title");
        expect(label).toHaveClass("custom-legend-class");
    });

    it("renders with custom default string", () => {
        render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={mockSetSelectedProjects}
                agreementFilterOptions={sampleAgreementFilterOptions}
                defaultString="Select a Project"
            />
        );

        expect(screen.getByText("Select a Project")).toBeInTheDocument();
    });

    it("renders with custom override styles", () => {
        const customStyles = { minWidth: "30rem", backgroundColor: "red" };
        const { container } = render(
            <ProjectTitleComboBox
                selectedProjects={[]}
                setSelectedProjects={mockSetSelectedProjects}
                agreementFilterOptions={sampleAgreementFilterOptions}
                overrideStyles={customStyles}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        const selectContainer = container.querySelector(".project-title-combobox__control");
        expect(selectContainer).toHaveStyle({ minWidth: "30rem" });
    });
});
