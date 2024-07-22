import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter, useLocation } from "react-router-dom";
import { vi } from "vitest";
import { useChangeRequestTotal } from "../../../hooks/useChangeRequests.hooks";
import store from "../../../store";
import AgreementTabs from "./AgreementsTabs";

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useLocation: vi.fn(),
        useSearchParams: vi.fn(),
        useNavigate: vi.fn()
    };
});

vi.mock("../../../hooks/useChangeRequests.hooks");

describe("AgreementTabs", () => {
    beforeEach(() => {
        useLocation.mockReturnValue({
            search: ""
        });
        useChangeRequestTotal.mockReturnValue(5);
    });

    test("renders without crashing", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementTabs />
                </BrowserRouter>
            </Provider>
        );
    });

    test("renders all links with correct labels", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementTabs />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByText("All Agreements")).toBeInTheDocument();
        expect(screen.getByText("My Agreements")).toBeInTheDocument();
        expect(screen.getByText("For Review")).toBeInTheDocument();
    });

    test("applies correct class based on location", () => {
        useLocation.mockReturnValueOnce({
            search: "?filter=my-agreements"
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementTabs />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByText("My Agreements").className).toMatch(/ .*listItemSelected.*/);
        expect(screen.getByText("All Agreements").className).toMatch(/ .*listItemNotSelected.*/);
        expect(screen.getByText("For Review").className).toMatch(/ .*listItemNotSelected.*/);
    });

    test("displays notification circle with correct number", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementTabs />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByText("5")).toBeInTheDocument();
    });
});
