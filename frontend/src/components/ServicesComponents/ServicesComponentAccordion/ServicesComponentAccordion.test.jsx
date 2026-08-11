import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ServicesComponentAccordion from "./ServicesComponentAccordion";
import styles from "./ServicesComponentAccordion.module.css";

/* eslint-disable testing-library/no-container, testing-library/no-node-access */
// Note: Using container.querySelector is necessary for testing className changes
// on the description span, which doesn't have accessible queries available

const baseProps = {
    servicesComponentNumber: 3,
    serviceRequirementType: "NON_SEVERABLE",
    optional: true
};

describe("ServicesComponentAccordion header description", () => {
    it("shows the description in the header when there is no in-body metadata", () => {
        const { container } = render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={false}
                description="Phase 2 data collection and analysis"
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        const button = screen.getByRole("button", { name: /Optional Services Component 3/ });
        expect(button).toHaveTextContent("Optional Services Component 3: Phase 2 data collection and analysis");
        const descriptionSpan = container.querySelector(`.${styles.description}`);
        expect(descriptionSpan).toHaveClass(styles.description);
    });

    it("trims leading and trailing whitespace from a rendered description", () => {
        const { container } = render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={false}
                description="  Phase 2 data collection  "
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        const descriptionSpan = container.querySelector(`.${styles.description}`);
        expect(descriptionSpan.textContent).toBe(": Phase 2 data collection");
    });

    it("shows only the name (no colon) when the description is empty", () => {
        const { container } = render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={false}
                description=""
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        const button = screen.getByRole("button", { name: /Optional Services Component 3/ });
        expect(button.textContent.trim()).toBe("Optional Services Component 3");
        const descriptionSpan = container.querySelector(`.${styles.description}`);
        expect(descriptionSpan).not.toBeInTheDocument();
    });

    it("shows only the name (no colon) when the description is null", () => {
        const { container } = render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={false}
                description={null}
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        const button = screen.getByRole("button", { name: /Optional Services Component 3/ });
        expect(button.textContent.trim()).toBe("Optional Services Component 3");
        const descriptionSpan = container.querySelector(`.${styles.description}`);
        expect(descriptionSpan).not.toBeInTheDocument();
    });

    it("does NOT show the description in the header when metadata is displayed in the body (no-op)", () => {
        render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={true}
                description="Phase 2 data collection and analysis"
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        const button = screen.getByRole("button", { name: /Optional Services Component 3/ });
        expect(button).not.toHaveTextContent("Phase 2 data collection and analysis");
    });

    it("still toggles open/closed (regression)", async () => {
        const user = userEvent.setup();
        render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={false}
                description="Phase 2 data collection and analysis"
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        const button = screen.getByRole("button", { name: /Optional Services Component 3/ });
        expect(button).toHaveAttribute("aria-expanded", "true");
        await user.click(button);
        expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("shows only the name (no colon) when the description is whitespace only", () => {
        const { container } = render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={false}
                description="   "
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        const button = screen.getByRole("button", { name: /Optional Services Component 3/ });
        expect(button.textContent.trim()).toBe("Optional Services Component 3");
        const descriptionSpan = container.querySelector(`.${styles.description}`);
        expect(descriptionSpan).not.toBeInTheDocument();
    });
});

describe("ServicesComponentAccordion metadata rendering", () => {
    it("renders ServicesComponentMetadata in the body when withMetadata is true", () => {
        render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={true}
                description="Phase 2 data collection and analysis"
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("does not render ServicesComponentMetadata in the body when withMetadata is false", () => {
        render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={false}
                description="Phase 2 data collection and analysis"
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });
});

describe("ServicesComponentAccordion class assignments", () => {
    it("assigns correct classes to name and description spans", () => {
        const { container } = render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={false}
                description="Phase 2 data collection and analysis"
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        const nameSpan = container.querySelector(`.${styles.name}`);
        const descriptionSpan = container.querySelector(`.${styles.description}`);

        expect(nameSpan).toHaveTextContent("Optional Services Component 3");
        expect(nameSpan).not.toHaveClass(styles.description);
        expect(descriptionSpan).not.toHaveClass(styles.name);
    });
});

describe("ServicesComponentAccordion special cases", () => {
    it("displays the correct text when servicesComponentNumber is 0", () => {
        render(
            <ServicesComponentAccordion
                servicesComponentNumber={0}
                serviceRequirementType="NON_SEVERABLE"
                optional={true}
                withMetadata={false}
                description=""
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        const button = screen.getByRole("button", { name: /BLs not associated with a Services Component/ });
        expect(button).toBeInTheDocument();
    });

    it("renders an h3 heading via Accordion level prop", () => {
        render(
            <ServicesComponentAccordion
                {...baseProps}
                withMetadata={false}
                description=""
            >
                <div>child</div>
            </ServicesComponentAccordion>
        );
        expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    });
});
