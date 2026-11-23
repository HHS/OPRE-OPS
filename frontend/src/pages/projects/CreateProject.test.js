import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import CreateProject from "./CreateProject";

import store from "../../store";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { renderWithProviders } from "../../test-utils";
import { server } from "../../tests/mocks";

describe("Create Project component", () => {
    it("renders without errors", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <CreateProject />
                </BrowserRouter>
            </Provider>
        );
        // Verify the component renders without throwing
        expect(document.body).toBeInTheDocument();
    });

    it.each([
        ["Research", "RESEARCH"],
        ["Administrative", "ADMINISTRATIVE"],
        ["Technical Assistance", "TECHNICAL_ASSISTANCE"]
    ])("sends %s projects to the API as project_type %s", async (displayType, apiType) => {
        let payload = null;
        server.use(
            http.post("*/api/v1/projects/", async ({ request }) => {
                payload = await request.json();
                return HttpResponse.json({ id: 1001 }, { status: 201 });
            })
        );
        const user = userEvent.setup();
        renderWithProviders(<CreateProject />);

        await user.selectOptions(screen.getByLabelText(/project type/i), displayType);
        await user.type(screen.getByLabelText(/project title/i), "Typed Project");
        await user.type(screen.getByLabelText("Description"), "A description");
        await user.click(screen.getByRole("button", { name: "Create Project" }));

        await waitFor(() => expect(payload).not.toBeNull());
        expect(payload).toMatchObject({ project_type: apiType, title: "Typed Project" });
    });
});
