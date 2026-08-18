import Select from "../../UI/Form/Select";
import { FUNDING_PERIOD_OPTIONS } from "./GrantFundingPeriodSelect.constants";

const DEFAULT_OPTION = "-Select Grant Funding Period-";

/**
 * GrantFundingPeriodSelect is a select component for choosing a grant funding period, in months.
 *
 * @component
 * @param {Object} props - The properties that define the GrantFundingPeriodSelect component.
 * @param {number} props.value - The current value of the select component.
 * @param {Function} props.onChange - The function to call when the select value changes.
 * @param {boolean} [props.isDisabled=false] - Whether the select component is disabled. optional
 * @param {string} [props.tooltipMsg=""] - Tooltip message to display (optional).
 * @param {Object} [props.rest] - Any additional properties to pass to the Select component. optional
 * @returns {React.ReactElement} The GrantFundingPeriodSelect component.
 */
function GrantFundingPeriodSelect({ value, onChange, isDisabled = false, tooltipMsg = "", ...rest }) {
    return (
        <Select
            name="funding_period_months"
            label="Grant Funding Period"
            className="padding-top-3"
            onChange={(name, selectedValue) =>
                onChange(name, !selectedValue || selectedValue === DEFAULT_OPTION ? null : Number(selectedValue))
            }
            value={value ?? ""}
            messages={[]}
            defaultOption={DEFAULT_OPTION}
            options={FUNDING_PERIOD_OPTIONS}
            isDisabled={isDisabled}
            tooltipMsg={tooltipMsg}
            {...rest}
        />
    );
}

export default GrantFundingPeriodSelect;
