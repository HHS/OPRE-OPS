import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import createBudgetLineSlice from "../../../../pages/budgetLines/createBudgetLineSlice";
import ProjectSelect from "./ProjectSelect";

const renderWithRedux = (
    component,
    {
        initialState,
        store = configureStore({ reducer: { createBudgetLine: createBudgetLineSlice }, preloadedState: initialState }),
    } = {}
) => {
    return {
        ...render(<Provider store={store}>{component}</Provider>),
        store,
    };
};

const exampleResearchProjects = [
    { id: 1, title: "Project 1", description: "Description for Project 1" },
    { id: 2, title: "Project 2", description: "Description for Project 2" },
];
const exampleSelectedResearchProject = { id: 1, title: "Project 1", description: "Description for Project 1" };

describe("ProjectSelect component", () => {
    it("renders without crashing", () => {
        renderWithRedux(
            <ProjectSelect
                researchProjects={exampleResearchProjects}
                selectedResearchProject={exampleSelectedResearchProject}
                setSelectedProject={() => {}}
                clearFunction={() => {}}
            />
        );
    });
});
