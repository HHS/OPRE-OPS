import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useGetCanFundingSummaryQuery, useGetCansQuery, useLazyGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { cans } from "../../../tests/data";
import CANTable from "./CANTable";
import { Provider } from "react-redux";
import { USER_ROLES } from "../../Users/User.constants";
import configureStore from "redux-mock-store";

// Mock the PaginationNav component
vi.mock("../../UI/PaginationNav", () => ({
    default: () => <div data-testid="pagination-nav" />
}));

// Mock the Tooltip component
vi.mock("../../UI/USWDS/Tooltip", () => ({
    default: ({ children }) => <div data-testid="tooltip">{children}</div>
}));
vi.mock("../../../api/opsAPI");

const mockStore = configureStore([]);
const initialState = {
    auth: {
        activeUser: {
            id: 500,
            name: "Test User",
            roles: [USER_ROLES.SYSTEM_OWNER]
        }
    },
    alert: {
        isActive: false
    }
};
const store = mockStore(initialState);

describe("CANTable", () => {
    useGetCansQuery.mockReturnValue({
        data: cans
    });
    useGetCanFundingSummaryQuery.mockReturnValue({
        data: {
            fundingSummary: {
                available_funding: 1000,
                received_funding: 500,
                total_funding: 1500
            }
        }
    });
    useLazyGetCanFundingSummaryQuery.mockReturnValue([() => {}, { isLoading: false }]);
    it("renders the table with correct headers", () => {
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <CANTable cans={cans} />
                </Provider>
            </MemoryRouter>
        );

        expect(screen.getByText("CAN")).toBeInTheDocument();
        expect(screen.getByText("Portfolio")).toBeInTheDocument();
        expect(screen.getByText("Active Period")).toBeInTheDocument();
        expect(screen.getByText("Obligate By")).toBeInTheDocument();
        expect(screen.getByText("Funding Received")).toBeInTheDocument();
        expect(screen.getByText("Available Budget")).toBeInTheDocument();
    });

    it("renders the correct number of rows", () => {
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <CANTable cans={cans} />
                </Provider>
            </MemoryRouter>
        );

        const rows = screen.getAllByRole("row");
        // +1 for the header row
        expect(rows.length).toBe(cans.length + 1);
    });

    it('displays "No CANs found" when cans array is empty', () => {
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <CANTable cans={[]} />
                </Provider>
            </MemoryRouter>
        );

        expect(screen.getByText("No CANs found")).toBeInTheDocument();
    });

    it("does not render PaginationNav when there are no CANs", () => {
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <CANTable cans={[]} />
                </Provider>
            </MemoryRouter>
        );

        expect(screen.queryByTestId("pagination-nav")).not.toBeInTheDocument();
    });
});
