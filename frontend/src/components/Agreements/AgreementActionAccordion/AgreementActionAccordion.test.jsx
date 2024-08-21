import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { actionOptions } from "../../../pages/agreements/review/ReviewAgreement.constants";
import AgreementActionAccordion from "./AgreementActionAccordion";

describe("AgreementActionAccordion", () => {
    const mockSetAction = vi.fn();
    let user;

    beforeEach(() => {
        user = userEvent.setup();
        mockSetAction.mockClear();
    });

    it("renders the accordion with correct heading", () => {
        render(<AgreementActionAccordion setAction={mockSetAction} />);
        expect(screen.getByRole("button", { name: "Choose a Status Change" })).toBeInTheDocument();
    });

    it("renders two radio button tiles with correct labels", () => {
        render(<AgreementActionAccordion setAction={mockSetAction} />);
        expect(
            screen.getByRole("radio", { name: new RegExp(actionOptions.CHANGE_DRAFT_TO_PLANNED) })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("radio", { name: new RegExp(actionOptions.CHANGE_PLANNED_TO_EXECUTING) })
        ).toBeInTheDocument();
    });

    it("calls setAction when a radio button is clicked", async () => {
        render(<AgreementActionAccordion setAction={mockSetAction} />);
        await user.click(screen.getByRole("radio", { name: new RegExp(actionOptions.CHANGE_DRAFT_TO_PLANNED) }));
        expect(mockSetAction).toHaveBeenCalledWith(actionOptions.CHANGE_DRAFT_TO_PLANNED);
    });

    it("disables the first option when optionOneDisabled is true", () => {
        render(
            <AgreementActionAccordion
                setAction={mockSetAction}
                optionOneDisabled={true}
            />
        );
        expect(screen.getByRole("radio", { name: new RegExp(actionOptions.CHANGE_DRAFT_TO_PLANNED) })).toBeDisabled();
    });

    it("disables the second option when optionTwoDisabled is true", () => {
        render(
            <AgreementActionAccordion
                setAction={mockSetAction}
                optionTwoDisabled={true}
            />
        );
        expect(
            screen.getByRole("radio", { name: new RegExp(actionOptions.CHANGE_PLANNED_TO_EXECUTING) })
        ).toBeDisabled();
    });

    it("allows user to change selection", async () => {
        render(<AgreementActionAccordion setAction={mockSetAction} />);
        await user.click(screen.getByRole("radio", { name: new RegExp(actionOptions.CHANGE_DRAFT_TO_PLANNED) }));
        expect(mockSetAction).toHaveBeenCalledWith(actionOptions.CHANGE_DRAFT_TO_PLANNED);

        await user.click(screen.getByRole("radio", { name: new RegExp(actionOptions.CHANGE_PLANNED_TO_EXECUTING) }));
        expect(mockSetAction).toHaveBeenCalledWith(actionOptions.CHANGE_PLANNED_TO_EXECUTING);
    });
});
