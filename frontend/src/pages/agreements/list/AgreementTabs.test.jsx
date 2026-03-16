import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
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

vi.mock("react-redux", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useSelector: vi.fn()
    };
});

describe("AgreementTabs", () => {
    beforeEach(() => {
        useLocation.mockReturnValue({
            search: ""
        });
        useChangeRequestTotal.mockReturnValue(5);
        useSelector.mockReturnValue([{ id: 3, name: "REVIEWER_APPROVER" }]);
    });

    test("renders without crashing", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementTabs />
                </BrowserRouter>
            </Provider>
        );
        expect(document.body).toBeInTheDocument();
    });

    test("renders all links including For Review for REVIEWER_APPROVER", () => {
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

    test("does not render For Review tab for non-REVIEWER_APPROVER users", () => {
        useSelector.mockReturnValue([{ id: 2, name: "VIEWER_EDITOR" }]);

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementTabs />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByText("All Agreements")).toBeInTheDocument();
        expect(screen.getByText("My Agreements")).toBeInTheDocument();
        expect(screen.queryByText("For Review")).not.toBeInTheDocument();
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
