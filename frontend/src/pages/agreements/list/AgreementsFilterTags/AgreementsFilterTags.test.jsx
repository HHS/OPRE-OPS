import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AgreementsFilterTags from "./AgreementsFilterTags";

// Regression coverage for issue #6144: AgreementNameComboBox (F2) now emits `title` as the
// nickname-preferred display string, and this component keys both tagText and removal off
// `item.title` — so it needs zero code changes to show/remove the nickname correctly. These
// tests lock that in.
describe("AgreementsFilterTags", () => {
    const mockSetFilters = vi.fn();

    const mockFilters = {
        fiscalYear: [],
        portfolio: [],
        projectTitle: [],
        agreementType: [],
        agreementName: [],
        contractNumber: [],
        awardType: []
    };

    beforeEach(() => {
        mockSetFilters.mockClear();
    });

    it("does not render when no filters are active", () => {
        render(
            <AgreementsFilterTags
                filters={mockFilters}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows the nickname-preferred title as the agreement name tag text", () => {
        const filters = {
            ...mockFilters,
            agreementName: [
                { id: 1, title: "HS", name: "Head Start Contract", nick_name: "HS", display_name: "HS" },
                {
                    id: 2,
                    title: "Full Title, No Nickname",
                    name: "Full Title, No Nickname",
                    nick_name: null,
                    display_name: "Full Title, No Nickname"
                }
            ]
        };

        render(
            <AgreementsFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        expect(screen.getByText("HS")).toBeInTheDocument();
        expect(screen.getByText("Full Title, No Nickname")).toBeInTheDocument();
        expect(screen.queryByText("Head Start Contract")).not.toBeInTheDocument();
    });

    it("removes the agreement name tag by its nickname-preferred title", async () => {
        const user = userEvent.setup();
        const filters = {
            ...mockFilters,
            agreementName: [{ id: 1, title: "HS", name: "Head Start Contract", nick_name: "HS", display_name: "HS" }]
        };

        render(
            <AgreementsFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        const removeIcon = screen.getByLabelText("Remove HS filter");
        await user.click(removeIcon);

        expect(mockSetFilters).toHaveBeenCalled();
        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({ agreementName: filters.agreementName });
        expect(result.agreementName).toHaveLength(0);
    });

    it("keeps other agreement name tags when removing one by title", async () => {
        const user = userEvent.setup();
        const filters = {
            ...mockFilters,
            agreementName: [
                { id: 1, title: "HS", name: "Head Start Contract", nick_name: "HS", display_name: "HS" },
                { id: 2, title: "AACFRC", name: "African American Child and Family Research Center" }
            ]
        };

        render(
            <AgreementsFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        const removeIcon = screen.getByLabelText("Remove HS filter");
        await user.click(removeIcon);

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({ agreementName: filters.agreementName });
        expect(result.agreementName).toHaveLength(1);
        expect(result.agreementName[0].id).toBe(2);
    });

    it("removes only the clicked agreement when two selections render an identical tag (nickname/name collision)", async () => {
        const user = userEvent.setup();
        // Agreement A's nick_name equals agreement B's full name — both render the tag text "ABC".
        const filters = {
            ...mockFilters,
            agreementName: [
                { id: 1, title: "ABC", name: "Agreement With Nickname ABC", nick_name: "ABC" },
                { id: 2, title: "ABC", name: "ABC" }
            ]
        };

        render(
            <AgreementsFilterTags
                filters={filters}
                setFilters={mockSetFilters}
            />
        );

        const removeIcons = screen.getAllByLabelText("Remove ABC filter");
        expect(removeIcons).toHaveLength(2);
        await user.click(removeIcons[0]);

        const setFiltersCallback = mockSetFilters.mock.calls[0][0];
        const result = setFiltersCallback({ agreementName: filters.agreementName });

        // Only the id-1 selection should be removed; the id-2 collision survives.
        expect(result.agreementName).toHaveLength(1);
        expect(result.agreementName[0].id).toBe(2);
    });
});
