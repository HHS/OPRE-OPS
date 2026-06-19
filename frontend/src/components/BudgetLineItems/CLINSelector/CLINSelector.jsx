import { useState } from "react";
import PropTypes from "prop-types";

// Fixed CLIN options 1-10
const CLIN_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    name: `CLIN ${i + 1}`
}));

/**
 * CLINSelector - Inline component for selecting and adding a CLIN to a budget line item
 * Displays a dropdown and button with a red alert message
 * @param {Object} props
 * @param {Function} props.onAddCLIN - Callback when Add CLIN is clicked (receives clinNumber)
 * @param {number} props.budgetLineId - The budget line item ID being edited
 * @param {number} [props.currentClinNumber] - Currently assigned CLIN number (if any)
 * @returns {JSX.Element}
 */
const CLINSelector = ({ onAddCLIN, budgetLineId, currentClinNumber }) => {
    const [selectedCLIN, setSelectedCLIN] = useState(currentClinNumber?.toString() || "");

    const handleAddCLIN = () => {
        if (selectedCLIN) {
            onAddCLIN(parseInt(selectedCLIN)); // Pass CLIN number (1-10)
        }
    };

    return (
        <div className="margin-bottom-2">
            <div className="font-12px usa-form-group usa-form-group--error margin-left-0 margin-bottom-2">
                <span
                    className="usa-error-message text-normal margin-left-neg-1"
                    role="alert"
                >
                    This information is required to submit for approval
                </span>
            </div>

            <div className="display-flex flex-align-end gap-2">
                <div>
                    <label
                        className="usa-label margin-top-0"
                        htmlFor={`clin-select-${budgetLineId}`}
                    >
                        CLIN
                    </label>
                    <select
                        id={`clin-select-${budgetLineId}`}
                        className="usa-select"
                        style={{ minWidth: "300px" }}
                        value={selectedCLIN}
                        onChange={(e) => setSelectedCLIN(e.target.value)}
                        data-cy="clin-selector-dropdown"
                    >
                        <option value="">- Select CLIN -</option>
                        {CLIN_OPTIONS.map((clin) => (
                            <option
                                key={clin.id}
                                value={clin.id}
                            >
                                {clin.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    className="usa-button usa-button--outline margin-left-4"
                    onClick={handleAddCLIN}
                    disabled={!selectedCLIN}
                    data-cy="add-clin-button"
                >
                    Add CLIN
                </button>
            </div>
        </div>
    );
};

CLINSelector.propTypes = {
    onAddCLIN: PropTypes.func.isRequired,
    budgetLineId: PropTypes.number.isRequired,
    currentClinNumber: PropTypes.number
};

export default CLINSelector;
