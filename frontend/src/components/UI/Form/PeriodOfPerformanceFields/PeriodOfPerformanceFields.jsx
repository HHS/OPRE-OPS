import PropTypes from "prop-types";
import DatePicker from "../../USWDS/DatePicker";
import DateRangePickerWrapper from "../../USWDS/DateRangePickerWrapper";

/**
 * Shared Period of Performance start/end date pickers, used by ServicesComponentForm and
 * GrantNumberForm — the fields are identical between the two, only their DOM ids differ.
 * @param {Object} props - The component props.
 * @param {string} [props.idPrefix] - Prefix for the wrapper/date-picker DOM ids, so the two forms
 *   don't collide when both could theoretically be present on the same page.
 * @param {number} props.formKey - Remount key so switching between add/edit resets picker state.
 * @param {{popStartDate: string, popEndDate: string}} props.formData - The form data.
 * @param {Function} props.setFormData - Function to set form data.
 * @returns {React.ReactElement} The rendered PeriodOfPerformanceFields component.
 */
function PeriodOfPerformanceFields({ idPrefix = "", formKey, formData, setFormData }) {
    return (
        <DateRangePickerWrapper
            id={`${idPrefix}period-of-performance`}
            key={formKey}
            className="display-flex flex-justify "
        >
            <div style={{ width: "275px" }}>
                <DatePicker
                    id={`${idPrefix}pop-start-date`}
                    name="pop-start-date"
                    label="Period of Performance-Start"
                    hint="mm/dd/yyyy"
                    value={formData.popStartDate}
                    onChange={(e) =>
                        setFormData((currentFormData) => ({
                            ...currentFormData,
                            popStartDate: e.target.value
                        }))
                    }
                />
            </div>
            <div style={{ width: "275px" }}>
                <DatePicker
                    id={`${idPrefix}pop-end-date`}
                    name="pop-end-date"
                    label="Period of Performance-End"
                    hint="mm/dd/yyyy"
                    value={formData.popEndDate}
                    onChange={(e) =>
                        setFormData((currentFormData) => ({
                            ...currentFormData,
                            popEndDate: e.target.value
                        }))
                    }
                />
            </div>
        </DateRangePickerWrapper>
    );
}

PeriodOfPerformanceFields.propTypes = {
    idPrefix: PropTypes.string,
    formKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    formData: PropTypes.shape({
        popStartDate: PropTypes.string,
        popEndDate: PropTypes.string
    }).isRequired,
    setFormData: PropTypes.func.isRequired
};

export default PeriodOfPerformanceFields;
