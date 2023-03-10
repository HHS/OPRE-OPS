// TODO: REFACTOR THIS COMPONENT TO USE THE PROPS PASSED TO IT
export const StepIndicatorTwo = () => {
    return (
        <div className="usa-step-indicator usa-step-indicator--counters" aria-label="progress">
            <ol className="usa-step-indicator__segments">
                <li className="usa-step-indicator__segment usa-step-indicator__segment--complete">
                    <span className="usa-step-indicator__segment-label">
                        Project & Agreement<span className="usa-sr-only">completed</span>
                    </span>
                </li>
                <li className="usa-step-indicator__segment usa-step-indicator__segment--current" aria-current="true">
                    <span className="usa-step-indicator__segment-label">Budget Lines</span>
                </li>
                <li className="usa-step-indicator__segment">
                    <span className="usa-step-indicator__segment-label">Review</span>
                </li>
            </ol>
        </div>
    );
};
