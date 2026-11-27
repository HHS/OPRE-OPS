import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ContractModificationReviewCard from "./ContractModificationReviewCard";

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetAgreementName: () => "Agreement Name B"
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: () => "Sheila Celentano"
}));

const baseRequest = {
    id: 9,
    agreement_id: 42,
    created_by: 503,
    created_on: "2026-11-17",
    modification_type: "MODIFIED_LOE",
    budget_line_items: []
};

const renderCard = (request = {}) => {
    const router = createMemoryRouter(
        [{ path: "/", element: <ContractModificationReviewCard request={{ ...baseRequest, ...request }} /> }],
        { initialEntries: ["/"] }
    );
    return render(<RouterProvider router={router} />);
};

describe("ContractModificationReviewCard", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        ["MODIFIED_LOE", "Modified LOE"],
        ["ADMIN", "Admin Change"],
        ["AS_IS", "As-Is"],
        ["DE_OBLIGATION", "De-obligation"]
    ])(
        "renders Agreement, Modification Type (%s -> %s), Requested by, and the request date",
        (modificationType, label) => {
            renderCard({ modification_type: modificationType });

            expect(screen.getByText("Contract Modification")).toBeInTheDocument();
            expect(screen.getByText("Agreement Name B")).toBeInTheDocument();
            expect(screen.getByText(label)).toBeInTheDocument();
            expect(screen.getByText("Sheila Celentano")).toBeInTheDocument();
        }
    );

    it("has a 'Review Agreement' link instead of quick approve/decline icons (OPS-6489)", () => {
        renderCard();

        expect(screen.getByRole("button", { name: /review agreement agreement name b/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Decline" })).not.toBeInTheDocument();
    });

    it("navigates to the Mod Approval page for this agreement when clicked", async () => {
        const router = createMemoryRouter(
            [
                { path: "/", element: <ContractModificationReviewCard request={baseRequest} /> },
                {
                    path: "/agreements/:id/review-modification",
                    element: <div data-testid="mod-approval-page">Mod Approval</div>
                }
            ],
            { initialEntries: ["/"] }
        );
        render(<RouterProvider router={router} />);

        await userEvent.click(screen.getByRole("button", { name: /review agreement/i }));

        expect(await screen.findByTestId("mod-approval-page")).toBeInTheDocument();
    });
});
