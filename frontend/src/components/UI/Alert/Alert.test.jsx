import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import configureStore from "redux-mock-store";
import Alert from "./Alert";

const mockStore = configureStore([]);

describe("Alert component", () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            alert: {
                heading: "Test Heading",
                message: "Test Message",
                type: "success",
                redirectUrl: null
            }
        });
    });

    it("renders the alert component", () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Alert />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders the correct heading and message", () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Alert />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText("Test Heading")).toBeInTheDocument();
        expect(screen.getByText("Test Message")).toBeInTheDocument();
    });

    it("renders the correct class based on the type prop", () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Alert />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByRole("status")).toHaveClass("usa-alert--success");
    });

    describe("redirectUrl and the breadcrumb trail", () => {
        const trail = { targetPath: "/agreements/5", ancestors: [{ label: "Portfolios", to: "/portfolios" }] };

        const LocationState = () => {
            const location = useLocation();
            return (
                <output data-testid="location">
                    {JSON.stringify({ path: location.pathname, state: location.state })}
                </output>
            );
        };

        const renderAt = (redirectUrl) => {
            const redirectStore = mockStore({
                alert: { heading: "Saved", message: "Saved", type: "success", redirectUrl }
            });
            render(
                <Provider store={redirectStore}>
                    <MemoryRouter
                        initialEntries={[
                            { pathname: "/agreements/5/award-approval", state: { breadcrumbTrail: trail } }
                        ]}
                    >
                        <Routes>
                            <Route
                                path="*"
                                element={
                                    <>
                                        <Alert />
                                        <LocationState />
                                    </>
                                }
                            />
                        </Routes>
                    </MemoryRouter>
                </Provider>
            );
            return JSON.parse(screen.getByTestId("location").textContent);
        };

        it("keeps the trail when redirecting within the same agreement", () => {
            expect(renderAt("/agreements/5/procurement-tracker")).toEqual({
                path: "/agreements/5/procurement-tracker",
                state: { breadcrumbTrail: trail }
            });
        });

        it("drops the trail when redirecting to a different page", () => {
            expect(renderAt("/agreements")).toEqual({ path: "/agreements", state: null });
        });
    });
});
