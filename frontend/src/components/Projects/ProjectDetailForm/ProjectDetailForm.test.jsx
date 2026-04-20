import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { opsApi } from "../../../api/opsAPI";
import ProjectDetailForm from "./ProjectDetailForm";
import suite from "./suite";

const mockProject = {
    id: 1000,
    title: "Human Services Interoperability Support",
    short_title: "HSS",
    description: "Interoperability activities description.",
    project_type: "RESEARCH"
};

const store = configureStore({
    reducer: {
        [opsApi.reducerPath]: opsApi.reducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware)
});

vi.mock("react-redux", async () => {
    const actual = await vi.importActual("react-redux");
    return {
        ...actual,
        useSelector: vi.fn((selector) => {
            const mockState = {
                alert: {
                    isActive: false
                }
            };
            return selector(mockState);
        })
    };
});

const renderComponent = () => {
    return render(
        <Provider store={store}>
            <ProjectDetailForm
                projectId={mockProject.id}
                projectTitle={mockProject.title}
                projectShortTitle={mockProject.short_title}
                projectDescription={mockProject.description}
                projectType={mockProject.project_type}
                toggleEditMode={vi.fn()}
            />
        </Provider>
    );
};

describe("ProjectDetailForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        suite.reset();
    });

    test("renders form with initial values", () => {
        renderComponent();

        expect(screen.getByLabelText(/project title/i)).toHaveValue(mockProject.title);
        expect(screen.getByLabelText(/project nickname/i)).toHaveValue(mockProject.short_title);
        expect(screen.getByLabelText(/description/i)).toHaveValue(mockProject.description);
    });

    test("validates required title field", async () => {
        renderComponent();
        const titleInput = screen.getByLabelText(/project title/i);

        await userEvent.clear(titleInput);
        fireEvent.blur(titleInput);

        expect(await screen.findByText("This is required information")).toBeInTheDocument();
    });

    test("shows confirmation modal when canceling", async () => {
        renderComponent();

        const cancelButton = screen.getByText(/cancel/i);
        await userEvent.click(cancelButton);

        expect(screen.getByText(/are you sure you want to cancel editing/i)).toBeInTheDocument();
    });

    test("disables save button when title is empty", async () => {
        renderComponent();
        const titleInput = screen.getByLabelText(/project title/i);

        await userEvent.clear(titleInput);

        expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    });

    test("enables save button when title has a value", () => {
        renderComponent();

        expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
    });
});
