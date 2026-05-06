import Accordion from "../../../components/UI/Accordion";
import { fromUpperCaseToTitleCase } from "../../../helpers/utils";
import "../../../components/Agreements/ProcurementTracker/StepBuilderAccordion/StepBuilderAccordion.css";

const formatStepLabel = (stepType) => {
    if (typeof stepType !== "string") {
        return "";
    }

    const trimmedStepType = stepType.trim();
    if (!trimmedStepType) {
        return "";
    }

    return trimmedStepType.includes("_") || trimmedStepType === trimmedStepType.toUpperCase()
        ? fromUpperCaseToTitleCase(trimmedStepType)
        : trimmedStepType;
};

/**
 * @typedef {Object} ProcurementStep
 * @property {number | string} id
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
 * @property {boolean} [isReadOnly=false]
 * @property {number} [level=3]
 */

/**
 * @param {StepBuilderAccordionProps} props
 * @returns {import("react").ReactElement}
 */
const DetailsBuilderAccordion = ({ step, totalSteps, children, isClosed = false, level = 3 }) => {
    const heading = (
        <div
            className={`step-builder-accordion__heading step-builder-accordion__heading--active`}
            data-testid={`step-builder-heading-${step?.id}`}
        >
            <span className="step-builder-accordion__step-count">
                <span className="step-builder-accordion__step-number">{step?.step_number}</span>{" "}
                <span className="step-builder-accordion__step-total">of {totalSteps}</span>
            </span>{" "}
            <span className="step-builder-accordion__step-label">{formatStepLabel(step?.step_type)}</span>
        </div>
    );

    return (
        <Accordion
            heading={heading}
            dataCy={`step-builder-accordion-${step?.id}`}
            isClosed={isClosed}
            level={level}
        >
            {children}
        </Accordion>
    );
};

export default DetailsBuilderAccordion;
