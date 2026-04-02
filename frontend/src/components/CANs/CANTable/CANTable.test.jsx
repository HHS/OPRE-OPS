import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cans } from "../../../tests/data";
import CANTable from "./CANTable";

const { dispatchMock, initiateMock } = vi.hoisted(() => ({
    dispatchMock: vi.fn(),
    initiateMock: vi.fn()
}));

// Mock the PaginationNav component
vi.mock("../../UI/PaginationNav", () => ({
    default: () => <div data-testid="pagination-nav" />
}));

// Mock the Tooltip component
vi.mock("../../UI/USWDS/Tooltip", () => ({
    default: ({ children }) => <div data-testid="tooltip">{children}</div>
}));

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock
}));

vi.mock("../../../api/opsAPI", () => ({
    opsApi: {
        endpoints: {
            getCanFunding: {
                initiate: initiateMock
            }
        }
    }
}));

describe("CANTable", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        initiateMock.mockImplementation((args) => args);
        dispatchMock.mockImplementation(() => ({
            unwrap: () =>
                Promise.resolve({
                    funding: {
                        available_funding: 1000,
                        received_funding: 500,
                        total_funding: 1500
                    }
                }),
            unsubscribe: vi.fn()
        }));
    });

    it("renders the table with correct headers", () => {
        render(
            <MemoryRouter>
                <CANTable cans={cans} />
            </MemoryRouter>
        );

        expect(screen.getByText("CAN")).toBeInTheDocument();
        expect(screen.getByText("Portfolio")).toBeInTheDocument();
        expect(screen.getByText("Active Period")).toBeInTheDocument();
        expect(screen.getByText("Obligate By")).toBeInTheDocument();
        expect(screen.getByText("Funding Received")).toBeInTheDocument();
        expect(screen.getByText("Available Budget")).toBeInTheDocument();
    });

    it("renders the correct number of rows", async () => {
        render(
            <MemoryRouter>
                <CANTable cans={cans} />
            </MemoryRouter>
        );

        await waitForElementToBeRemoved(() => screen.queryByRole("table", { name: "Loading CANs" }));

        const rows = screen.getAllByRole("row");
        // +1 for the header row
        expect(rows.length).toBe(cans.length + 1);
    });

    it("keeps the skeleton visible while row funding is loading", () => {
        dispatchMock.mockImplementation(() => ({
            unwrap: () => new Promise(() => {}),
            unsubscribe: vi.fn()
        }));

        render(
            <MemoryRouter>
                <CANTable cans={cans} />
            </MemoryRouter>
        );

        expect(screen.getByRole("table", { name: "Loading CANs" })).toBeInTheDocument();
    });

    it('displays "No CANs found" when cans array is empty', () => {
        render(
            <MemoryRouter>
                <CANTable cans={[]} />
            </MemoryRouter>
        );

        expect(screen.getByText("No CANs found")).toBeInTheDocument();
    });

    it("does not render PaginationNav when there are no CANs", () => {
        render(
            <MemoryRouter>
                <CANTable cans={[]} />
            </MemoryRouter>
        );

        expect(screen.queryByTestId("pagination-nav")).not.toBeInTheDocument();
    });
});
