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

    describe("searchText filtering (issue #6144 AC 3)", () => {
        const agreementOptions = [
            { id: 1, title: "HS", searchText: "Head Start Contract HS" },
            {
                id: 2,
                title: "AACFRC",
                searchText: "Contract #1: African American Child and Family Research Center AACFRC"
            },
            { id: 3, title: "No Search Text Option" }
        ];

        it("matches when the typed text appears only in searchText, not in the visible label", () => {
            render(
                <ComboBox
                    namespace="test"
                    data={agreementOptions}
                    selectedData={null}
                    setSelectedData={mockSetSelectedProject}
                />
            );
            const input = screen.getByRole("combobox");
            fireEvent.change(input, { target: { value: "Head Start" } });

            expect(screen.getByText("HS")).toBeInTheDocument();
            expect(screen.queryByText("AACFRC")).not.toBeInTheDocument();
        });

        it("resolves the same single option whether the user types the nickname or the full name", () => {
            const { unmount } = render(
                <ComboBox
                    namespace="test"
                    data={agreementOptions}
                    selectedData={null}
                    setSelectedData={mockSetSelectedProject}
                />
            );
            const input = screen.getByRole("combobox");

            fireEvent.change(input, { target: { value: "AACFRC" } });
            expect(screen.getByText("AACFRC")).toBeInTheDocument();
            expect(screen.queryByText("HS")).not.toBeInTheDocument();
            unmount();

            render(
                <ComboBox
                    namespace="test"
                    data={agreementOptions}
                    selectedData={null}
                    setSelectedData={mockSetSelectedProject}
                />
            );
            fireEvent.change(screen.getByRole("combobox"), {
                target: { value: "African American Child" }
            });
            expect(screen.getByText("AACFRC")).toBeInTheDocument();
            expect(screen.queryByText("HS")).not.toBeInTheDocument();
        });

        it("does not match unrelated text", () => {
            render(
                <ComboBox
                    namespace="test"
                    data={agreementOptions}
                    selectedData={null}
                    setSelectedData={mockSetSelectedProject}
                />
            );
            fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz-no-match-zzz" } });

            expect(screen.queryByText("HS")).not.toBeInTheDocument();
            expect(screen.queryByText("AACFRC")).not.toBeInTheDocument();
            expect(screen.queryByText("No Search Text Option")).not.toBeInTheDocument();
        });

        it("still matches on the option's id/value when it is a human-typeable code (e.g. ProjectTypeComboBox)", () => {
            // Mirrors ProjectTypeComboBox: id is a typeable code string, not shown in the label,
            // and no searchText is set. react-select's own defaultStringify includes option.value,
            // so this must keep matching even after the searchText override — regression guard for
            // the override accidentally dropping option.value from the searchable text.
            const projectTypeOptions = [
                { id: "ADMINISTRATIVE_AND_SUPPORT", title: "Admin & Support" },
                { id: "RESEARCH", title: "Research" }
            ];
            render(
                <ComboBox
                    namespace="test"
                    data={projectTypeOptions}
                    selectedData={null}
                    setSelectedData={mockSetSelectedProject}
                />
            );
            fireEvent.change(screen.getByRole("combobox"), { target: { value: "administrative" } });

            expect(screen.getByText("Admin & Support")).toBeInTheDocument();
            expect(screen.queryByText("Research")).not.toBeInTheDocument();
        });

        it("regression guard: filtering is unchanged for options without searchText", () => {
            // researchProjects (used throughout this file) has no searchText field on any option —
            // this pins that every other ComboBox usage in the app filters exactly as before.
            render(
                <ComboBox
                    namespace="test"
                    data={researchProjects}
                    selectedData={null}
                    setSelectedData={mockSetSelectedProject}
                />
            );
            const input = screen.getByRole("combobox");

            fireEvent.change(input, { target: { value: "Project 2" } });
            expect(screen.getByText("Project 2")).toBeInTheDocument();
            expect(screen.queryByText("Project 1")).not.toBeInTheDocument();
            expect(screen.queryByText("Project 3")).not.toBeInTheDocument();

            fireEvent.change(input, { target: { value: "Description 1" } });
            // "Description 1" only appears in the description field, which is not part of the
            // option label and has no searchText fallback for this dataset — must not match.
            expect(screen.queryByText("Project 1")).not.toBeInTheDocument();
        });
    });

    it("renders a loading skeleton in the dropdown menu", () => {
        const { container } = render(
            <ComboBox
                namespace="test"
                data={[]}
                selectedData={null}
                setSelectedData={mockSetSelectedProject}
                isLoading={true}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByTestId("combobox-loading-skeleton")).toBeInTheDocument();
    });
});
