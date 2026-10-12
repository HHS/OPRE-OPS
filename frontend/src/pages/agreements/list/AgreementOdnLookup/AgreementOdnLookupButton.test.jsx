import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLazyGetAgreementsQuery } from "../../../../api/opsAPI";
import AgreementOdnLookupButton from "./AgreementOdnLookupButton";

vi.mock("../../../../api/opsAPI");

vi.mock("../../../../hooks/use-alert.hooks", () => ({
    default: () => ({ setAlert: vi.fn() })
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

const renderComponent = () =>
    render(
        <BrowserRouter>
            <AgreementOdnLookupButton />
        </BrowserRouter>
    );

describe("AgreementOdnLookupButton", () => {
    let unwrapMock;
    let triggerMock;

    beforeEach(() => {
        mockNavigate.mockClear();
        unwrapMock = vi.fn();
        triggerMock = vi.fn(() => ({ unwrap: unwrapMock }));
        useLazyGetAgreementsQuery.mockReturnValue([triggerMock]);
    });

    it("renders a secondary trigger, not a persistent search bar — the lookup form is not visible until opened", () => {
        renderComponent();

        expect(screen.getByRole("button", { name: /find by odn/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/find agreement by odn/i)).not.toBeInTheDocument();
    });

    it("opens a modal containing the ODN lookup form when the trigger is clicked", () => {
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /find by odn/i }));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Find Agreement by ODN")).toBeInTheDocument();
        const input = screen.getByLabelText("Find agreement by ODN");
        expect(input).toBeInTheDocument();
        // Locks in ContainerModal's focus-on-open behavior landing on the actual input
        // (the first focusable element inside the modal), not some other control.
        expect(input).toHaveFocus();
    });

    it("closes the modal when Close is clicked", () => {
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /find by odn/i }));
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /close/i }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("starts fresh (no stale results) when reopened after a previous lookup", async () => {
        unwrapMock.mockResolvedValue({ agreements: [], count: 0 });
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /find by odn/i }));
        const input = screen.getByLabelText("Find agreement by ODN");
        fireEvent.change(input, { target: { value: "ODN-NONE" } });
        fireEvent.click(screen.getByRole("button", { name: /^find$/i }));
        expect(await screen.findByText(/no agreements found with odn/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /close/i }));
        fireEvent.click(screen.getByRole("button", { name: /find by odn/i }));

        expect(screen.queryByText(/no agreements found with odn/i)).not.toBeInTheDocument();
        expect(screen.getByLabelText("Find agreement by ODN")).toHaveValue("");
    });
});
