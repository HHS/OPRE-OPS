import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useUpdateChangeRequestMutation } from "../../../api/opsAPI";
import { useGetAgreementName } from "../../../hooks/lookup.hooks";
import ServicesComponentChangeReviewCard from "./ServicesComponentChangeReviewCard";

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetAgreementName: vi.fn()
}));
vi.mock("../../../api/opsAPI");

const changeRequest = (diff, linkedIds) => ({
    id: 9,
    agreement_id: 1,
    created_on: "2026-10-23T12:00:00.000000Z",
    created_by_user: { full_name: "John Doe" },
    requested_change_diff: diff,
    requested_change_info: { target_display_name: "SC2", linked_budget_line_item_ids: linkedIds }
});

const renderCard = (cr) =>
    render(
        <BrowserRouter>
            <ServicesComponentChangeReviewCard
                changeRequest={cr}
                handleReviewChangeRequest={vi.fn()}
            />
        </BrowserRouter>
    );

describe("ServicesComponentChangeReviewCard (OPS-6440)", () => {
    useGetAgreementName.mockReturnValue("Agreement Name");
    useUpdateChangeRequestMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    it("renders a Services Component addition with its budget lines", () => {
        renderCard(changeRequest({ services_component_create: { old: null, new: "SC2" } }, [15012, 15013]));

        expect(screen.getByRole("heading", { name: "Budget Change" })).toBeInTheDocument();
        expect(screen.getByText("Agreement Name")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getAllByText("SC2").length).toBeGreaterThan(0);
        expect(screen.getByText("Add Services Component")).toBeInTheDocument();
        expect(screen.getByText("15012")).toBeInTheDocument();
        expect(screen.getByText("15013")).toBeInTheDocument();
        expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("shows None when no budget lines are listed", () => {
        renderCard(changeRequest({ services_component_create: { old: null, new: "SC2" } }, []));

        expect(screen.getAllByText("None").length).toBe(2);
    });
});
