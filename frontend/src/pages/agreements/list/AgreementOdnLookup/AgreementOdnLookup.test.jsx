import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLazyGetAgreementsQuery } from "../../../../api/opsAPI";
import AgreementOdnLookup from "./AgreementOdnLookup";

vi.mock("../../../../api/opsAPI");

const mockSetAlert = vi.fn();
vi.mock("../../../../hooks/use-alert.hooks", () => ({
    default: () => ({ setAlert: mockSetAlert })
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock("../../../../components/Agreements/AgreementsTable", () => ({
    default: ({ agreements }) => (
        <div data-testid="agreements-table">
            {agreements.map((agreement) => (
                <div key={agreement.id}>{agreement.name}</div>
            ))}
        </div>
    )
}));

const renderComponent = () =>
    render(
        <BrowserRouter>
            <AgreementOdnLookup />
        </BrowserRouter>
    );

const typeAndSubmit = (value) => {
    const input = screen.getByLabelText(/find agreement by odn/i);
    fireEvent.change(input, { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: /find/i }));
};

describe("AgreementOdnLookup", () => {
    let unwrapMock;
    let triggerMock;

    beforeEach(() => {
        mockNavigate.mockClear();
        mockSetAlert.mockClear();
        unwrapMock = vi.fn();
        triggerMock = vi.fn(() => ({ unwrap: unwrapMock }));
        useLazyGetAgreementsQuery.mockReturnValue([triggerMock]);
    });

    it("navigates to the agreement when exactly one match is found", async () => {
        unwrapMock.mockResolvedValue({ agreements: [{ id: 42, name: "Match" }], count: 1 });
        renderComponent();

        typeAndSubmit("ODN-0001");

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/agreements/42"));
        expect(triggerMock).toHaveBeenCalledWith({ filters: { odn: ["ODN-0001"] }, page: 0, limit: 50 });
    });

    it("renders the results table when multiple matches are found", async () => {
        unwrapMock.mockResolvedValue({
            agreements: [
                { id: 1, name: "First" },
                { id: 2, name: "Second" }
            ],
            count: 2
        });
        renderComponent();

        typeAndSubmit("ODN-SHARED");

        expect(await screen.findByTestId("agreements-table")).toBeInTheDocument();
        expect(screen.getByText("First")).toBeInTheDocument();
        expect(screen.getByText("Second")).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("renders an accessible no-match message when there are zero matches", async () => {
        unwrapMock.mockResolvedValue({ agreements: [], count: 0 });
        renderComponent();

        typeAndSubmit("ODN-NONE");

        const message = await screen.findByText(/no agreements found with odn/i);
        expect(message).toBeInTheDocument();
        expect(message).toHaveAttribute("role", "status");
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("trims whitespace and does not submit an empty value", () => {
        renderComponent();

        typeAndSubmit("   ");

        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("surfaces an error alert and does not get stuck loading when the lookup fails", async () => {
        unwrapMock.mockRejectedValue(new Error("network error"));
        renderComponent();

        typeAndSubmit("ODN-ERROR");

        await waitFor(() =>
            expect(mockSetAlert).toHaveBeenCalledWith(
                expect.objectContaining({ type: "error", message: expect.stringContaining("error looking up") })
            )
        );
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(screen.queryByText(/searching for agreement/i)).not.toBeInTheDocument();
    });

    it("ignores a stale response from an earlier submission superseded by a later one", async () => {
        let resolveFirst;
        const firstPromise = new Promise((resolve) => {
            resolveFirst = resolve;
        });
        unwrapMock
            .mockImplementationOnce(() => firstPromise)
            .mockImplementationOnce(() => Promise.resolve({ agreements: [{ id: 99, name: "Second" }], count: 1 }));
        renderComponent();

        typeAndSubmit("ODN-FIRST");
        typeAndSubmit("ODN-SECOND");

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/agreements/99"));
        mockNavigate.mockClear();

        resolveFirst({ agreements: [{ id: 1, name: "First" }], count: 1 });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("submits via Enter key in the input (native form submission)", async () => {
        unwrapMock.mockResolvedValue({ agreements: [{ id: 7, name: "Enter Match" }], count: 1 });
        renderComponent();

        const input = screen.getByLabelText(/find agreement by odn/i);
        fireEvent.change(input, { target: { value: "ODN-ENTER" } });
        fireEvent.submit(screen.getByTestId("agreement-odn-lookup-form"));

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/agreements/7"));
    });
});
