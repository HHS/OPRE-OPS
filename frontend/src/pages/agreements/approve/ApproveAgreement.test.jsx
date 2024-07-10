import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetPortfoliosQuery,
    useGetServicesComponentsListQuery,
    useGetUserByIdQuery
} from "../../../api/opsAPI";
import { findDescription, findPeriodEnd, findPeriodStart } from "../../../helpers/servicesComponent.helpers";
import { useChangeRequestsForTooltip } from "../../../hooks/useChangeRequests.hooks";
import { useGetServicesComponentDisplayTitle } from "../../../hooks/useServicesComponents.hooks";
import store from "../../../store";
import { agreement, servicesComponent } from "../../../tests/data";
import Login from "../../Login";
import ApproveAgreement from "./ApproveAgreement";

vi.mock("../../../api/opsAPI");
vi.mock("../../../helpers/servicesComponent.helpers", () => ({
    findDescription: vi.fn(),
    findPeriodEnd: vi.fn(),
    findPeriodStart: vi.fn()
}));
vi.mock("../../../hooks/useServicesComponents.hooks", () => ({
    useGetServicesComponentDisplayTitle: vi.fn()
}));
vi.mock("../../../hooks/useChangeRequests.hooks", () => ({
    useChangeRequestsForTooltip: vi.fn()
}));
vi.mock("../../../hooks/use-auth.hooks", () => ({
    useAuth: () => ({
        isAuthenticated: true,
        user: { id: 1, name: "Test User" }
    })
}));
describe("ApproveAgreement", () => {
    useGetAgreementByIdQuery.mockReturnValue({
        data: agreement,
        isSuccess: true
    });
    useGetUserByIdQuery.mockReturnValue({
        data: {
            id: 1,
            first_name: "John",
            last_name: "Doe",
            email: "jdoe@example.com"
        },
        isSuccess: true
    });
    useGetServicesComponentsListQuery.mockReturnValue({
        data: servicesComponent,
        isSuccess: true
    });
    useGetPortfoliosQuery.mockReturnValue({
        data: [
            {
                id: 1,
                name: "Portfolio 1"
            }
        ],
        isSuccess: true
    });
    findDescription.mockReturnValue("description");
    findPeriodStart.mockReturnValue("2024-06-12T21:25:25.744930Z");
    findPeriodEnd.mockReturnValue("2024-06-12T21:25:25.744930Z");
    useGetServicesComponentDisplayTitle.mockReturnValue("title");
    useChangeRequestsForTooltip.mockReturnValue();
    // TODO: need to be authenticated to render the component?
    it.todo("should update heading based on Change Request type", () => {
        const router = createMemoryRouter(
            [
                {
                    path: "/agreements/approve/:id",
                    element: <ApproveAgreement />
                },
                {
                    path: "/login",
                    element: <Login />
                }
            ],
            {
                initialEntries: ["/agreements/approve/1?type=status-change&to=EXECUTING"]
            }
        );

        render(
            <Provider store={store}>
                <RouterProvider router={router} />
            </Provider>
        );
        screen.debug();

        // expect(screen.getByText("Approval for Status Change - Executing")).toBeInTheDocument();
    });

    it.todo("should display correct heading for budget change", () => {
        const router = createMemoryRouter(
            [
                {
                    path: "/agreements/approve/:id",
                    element: <ApproveAgreement />
                }
            ],
            {
                initialEntries: ["/agreements/approve/1?type=budget-change"]
            }
        );

        render(
            <Provider store={store}>
                <RouterProvider router={router} />
            </Provider>
        );

        expect(screen.getByText("Approval for Budget Change")).toBeInTheDocument();
    });
});
