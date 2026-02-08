import Accordion from "../../../UI/Accordion";
import { fromUpperCaseToTitleCase } from "../../../../helpers/utils";
import "./StepBuilderAccordion.css";

const STEP_STATUS_MAP = {
    COMPLETED: "completed",
    ACTIVE: "active"
};

const getStepState = (step, activeStepNumber) => {
    const mappedState = STEP_STATUS_MAP[step?.status];
    if (mappedState) {
        return mappedState;
    }

    if (typeof activeStepNumber === "number" && typeof step?.step_number === "number") {
        if (step.step_number < activeStepNumber) {
            return "completed";
        }

        if (step.step_number === activeStepNumber) {
            return "active";
        }
    }

    return "not-started";
};

/**
 * @typedef {Object} ProcurementStep
 * @property {number} id
 * @property {number} step_number
 * @property {string} step_type
 * @property {string} [status]
 */

/**
 * @typedef {Object} StepBuilderAccordionProps
 * @property {ProcurementStep} step
 * @property {number} totalSteps
 * @property {number} [activeStepNumber]
 * @property {import("react").ReactNode} [children]
 * @property {boolean} [isClosed=false]
 * @property {number} [level=3]
 */

/**
 * @param {StepBuilderAccordionProps} props
 * @returns {import("react").ReactElement}
 */
const StepBuilderAccordion = ({ step, totalSteps, activeStepNumber, children, isClosed = false, level = 3 }) => {
    const stepState = getStepState(step, activeStepNumber);

    const heading = (
        <div
            className={`step-builder-accordion__heading step-builder-accordion__heading--${stepState}`}
            data-testid={`step-builder-heading-${step?.id}`}
        >
            <span className="step-builder-accordion__step-count">
                <span className="step-builder-accordion__step-number">{step?.step_number}</span>{" "}
                <span className="step-builder-accordion__step-total">of {totalSteps}</span>
            </span>{" "}
            <span className="step-builder-accordion__step-label">{fromUpperCaseToTitleCase(step?.step_type)}</span>
        </div>
    );

    return (
        <Accordion
            heading={heading}
            isClosed={isClosed}
            level={level}
        >
            {children}
        </Accordion>
    );
};

export default StepBuilderAccordion;
