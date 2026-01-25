import PropTypes from "prop-types";

/**
 * Creates a wizard flow step indicator
 * ref: https://designsystem.digital.gov/components/step-indicator/
 *
 * Example Usage:
 * <StepIndicator steps={["Project & Agreement", "Budget Lines", "Review"]} currentStep={1} />
 *
 */
export const StepIndicator = ({ steps, currentStep }) => {
    return (
        <div
            className="usa-step-indicator usa-step-indicator--counters"
            aria-label="progress"
            data-cy="step-indicator"
        >
            <ol className="usa-step-indicator__segments">
                {steps.map((step, index) => (
                    <li
                        key={step}
                        data-cy={`step-indicator-${index}`}
                        className={`usa-step-indicator__segment ${
                            index + 1 === currentStep
                                ? "usa-step-indicator__segment--current"
                                : index + 1 < currentStep
                                  ? "usa-step-indicator__segment--complete"
                                  : ""
                        }`}
                    >
                        <span className="usa-step-indicator__segment-label">{step}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

StepIndicator.propTypes = {
    steps: PropTypes.arrayOf(PropTypes.string).isRequired,
    currentStep: PropTypes.number.isRequired
};

export default StepIndicator;
