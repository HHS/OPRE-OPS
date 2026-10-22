import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { buildTrailState } from "../../../helpers/breadcrumb.helpers";
import { LocationProbe } from "../../../test-utils";
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

        const renderAt = (redirectUrl, initialTrail = trail) => {
            const redirectStore = mockStore({
                alert: { heading: "Saved", message: "Saved", type: "success", redirectUrl }
            });
            render(
                <Provider store={redirectStore}>
                    <MemoryRouter
                        initialEntries={[
                            {
                                pathname: "/agreements/5/award-approval",
                                state: buildTrailState(initialTrail.targetPath, initialTrail.ancestors)
                            }
                        ]}
                    >
                        <Routes>
                            <Route
                                path="*"
                                element={
                                    <>
                                        <Alert />
                                        <LocationProbe />
                                    </>
                                }
                            />
                        </Routes>
                    </MemoryRouter>
                </Provider>
            );
            const probe = screen.getByTestId("location-probe");
            return { path: probe.dataset.pathname, state: JSON.parse(probe.textContent) };
        };

        it("keeps the trail when redirecting within the same agreement", () => {
            expect(renderAt("/agreements/5/procurement-tracker")).toEqual({
                path: "/agreements/5/procurement-tracker",
                state: buildTrailState(trail.targetPath, trail.ancestors)
            });
        });

        it("ends the trail before the agreement when redirecting back to it from an approval page", () => {
            const approvalTrail = {
                targetPath: "/agreements/5/award-approval",
                ancestors: [
                    { label: "Portfolios", to: "/portfolios" },
                    { label: "Agreement 5", to: "/agreements/5/procurement-tracker" }
                ]
            };
            expect(renderAt("/agreements/5/procurement-tracker", approvalTrail)).toEqual({
                path: "/agreements/5/procurement-tracker",
                state: buildTrailState("/agreements/5/procurement-tracker", [
                    { label: "Portfolios", to: "/portfolios" }
                ])
            });
        });

        it("drops the trail when redirecting to a different page", () => {
            expect(renderAt("/agreements")).toEqual({ path: "/agreements", state: null });
        });
    });
});
