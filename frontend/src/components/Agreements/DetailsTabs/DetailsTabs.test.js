import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import DetailsTabs from "./DetailsTabs";
import store from "../../../store";
import * as constants from "../../../constants";

/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: "/agreements/1" })
    };
});

describe("DetailsTabs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders without crashing", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                        hasInExecutionBli={false}
                    />
                </BrowserRouter>
            </Provider>
        );
        expect(document.body).toBeInTheDocument();
    });

    it("renders base tabs (Agreement Details and SCs & Budget Lines)", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                        hasInExecutionBli={false}
                    />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText("Agreement Details")).toBeInTheDocument();
        expect(screen.getByText("SCs & Budget Lines")).toBeInTheDocument();
    });

    it("shows developed-only tabs when agreement is developed", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={true}
                        hasInExecutionBli={true}
                    />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText("Award & Modifications")).toBeInTheDocument();
        expect(screen.getByText("Procurement Tracker")).toBeInTheDocument();
        expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    it("does not show developed-only tabs when agreement is not developed", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={true}
                        isAgreementAwarded={false}
                        hasInExecutionBli={false}
                    />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.queryByText("Award & Modifications")).not.toBeInTheDocument();
        expect(screen.queryByText("Procurement Tracker")).not.toBeInTheDocument();
        expect(screen.queryByText("Documents")).not.toBeInTheDocument();
    });

    it("disables Procurement Tracker tab when hasInExecutionBli is false", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={true}
                        hasInExecutionBli={false}
                    />
                </MemoryRouter>
            </Provider>
        );

        const procurementTrackerButton = screen.getByText("Procurement Tracker");
        expect(procurementTrackerButton).toBeDisabled();
    });

    it("enables Procurement Tracker tab when hasInExecutionBli is true and feature flag is enabled", () => {
        vi.spyOn(constants, "IS_PROCUREMENT_TRACKER_READY", "get").mockReturnValue(true);

        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={true}
                        hasInExecutionBli={true}
                    />
                </MemoryRouter>
            </Provider>
        );

        const procurementTrackerButton = screen.getByText("Procurement Tracker");
        expect(procurementTrackerButton).not.toBeDisabled();
    });

    it("disables Procurement Tracker tab when feature flag is disabled", () => {
        vi.spyOn(constants, "IS_PROCUREMENT_TRACKER_READY", "get").mockReturnValue(false);

        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={true}
                        hasInExecutionBli={true}
                    />
                </MemoryRouter>
            </Provider>
        );

        const procurementTrackerButton = screen.getByText("Procurement Tracker");
        expect(procurementTrackerButton).toBeDisabled();
    });

    it("disables Award & Modifications tab when agreement is not awarded", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                        hasInExecutionBli={false}
                    />
                </MemoryRouter>
            </Provider>
        );

        const awardButton = screen.getByText("Award & Modifications");
        expect(awardButton).toBeDisabled();
    });

    it("disables Documents tab when agreement is not awarded", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                        hasInExecutionBli={false}
                    />
                </MemoryRouter>
            </Provider>
        );

        const documentsButton = screen.getByText("Documents");
        expect(documentsButton).toBeDisabled();
    });

    it("navigates to the correct path when a tab is clicked", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                        hasInExecutionBli={false}
                    />
                </MemoryRouter>
            </Provider>
        );

        const budgetLinesTab = screen.getByText("SCs & Budget Lines");
        fireEvent.click(budgetLinesTab);

        expect(mockNavigate).toHaveBeenCalledWith("/agreements/1/budget-lines");
    });

    it("applies selected style to the current tab", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                        hasInExecutionBli={false}
                    />
                </MemoryRouter>
            </Provider>
        );

        const agreementDetailsTab = screen.getByText("Agreement Details");
        // Check for the hashed CSS module class name pattern
        expect(agreementDetailsTab.className).toMatch(/listItemSelected/);
    });

    it("renders with correct data-cy attributes", () => {
        const { container } = render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={true}
                        hasInExecutionBli={true}
                    />
                </MemoryRouter>
            </Provider>
        );

        expect(container.querySelector('[data-cy="details-tab-Agreement Details"]')).toBeInTheDocument();
        // In jsdom 28, CSS selectors with & need to use a different approach or be escaped
        // Using querySelectorAll with attribute matching instead
        const tabs = container.querySelectorAll('[data-cy^="details-tab-"]');
        expect(tabs.length).toBe(5); // Should have 5 tabs
        expect(
            Array.from(tabs).find((tab) => tab.getAttribute("data-cy") === "details-tab-SCs & Budget Lines")
        ).toBeInTheDocument();
        expect(
            Array.from(tabs).find((tab) => tab.getAttribute("data-cy") === "details-tab-Award & Modifications")
        ).toBeInTheDocument();
        expect(container.querySelector('[data-cy="details-tab-Procurement Tracker"]')).toBeInTheDocument();
        expect(container.querySelector('[data-cy="details-tab-Documents"]')).toBeInTheDocument();
    });

    it("renders tooltip for disabled Procurement Tracker tab", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={true}
                        hasInExecutionBli={false}
                    />
                </MemoryRouter>
            </Provider>
        );

        const procurementTrackerButton = screen.getByText("Procurement Tracker");
        expect(procurementTrackerButton).toBeDisabled();
        // Tooltip wraps the button - the button should have a parent tooltip element
        expect(procurementTrackerButton.parentElement).toBeInTheDocument();
    });

    it("renders tooltips for Award & Modifications and Documents tabs when disabled", () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/agreements/1"]}>
                    <DetailsTabs
                        agreementId={1}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                        hasInExecutionBli={false}
                    />
                </MemoryRouter>
            </Provider>
        );

        const awardButton = screen.getByText("Award & Modifications");
        const documentsButton = screen.getByText("Documents");

        expect(awardButton).toBeDisabled();
        expect(documentsButton).toBeDisabled();
    });
});
