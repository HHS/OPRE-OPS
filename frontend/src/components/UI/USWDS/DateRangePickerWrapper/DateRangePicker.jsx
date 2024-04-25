import { forwardRef, useImperativeHandle, useRef, useState } from "react";

// export interface DatePickerProps {
//   id: string;
//   minDate?: string;
//   maxDate?: string;
//   onChange?: (ev: React.ChangeEvent<HTMLInputElement>) => void;
//   label?: string;
//   disabled?: boolean;
//   name?: string;
//   value?: string;
//   required?: boolean;
// }

function DatePickerComponent({ id, minDate, maxDate, label, onChange, disabled, name, value, required }, ref) {
    const [isDisabled, setIsDisabled] = useState(disabled !== undefined ? disabled : false);

    const [dateValue, setDateValue] = useState(value ?? null);

    function clearValue() {
        setDateValue("");
    }

    function resetValue() {
        if (value) {
            setDateValue(value);
        }
    }

    function setValue(value) {
        setDateValue(value);
    }

    function disable(value) {
        setIsDisabled(value);
    }

    useImperativeHandle(ref, () => {
        return {
            clearValue,
            resetValue,
            setValue,
            disable
        };
    });

    return (
        <div className="usa-form-group">
            <label
                className="usa-label"
                id={id + "-date-label"}
                htmlFor={id + "-date"}
            >
                {label || ""}
            </label>
            <div className="usa-date-picker">
                <input
                    type="date"
                    className="usa-input"
                    id={id}
                    name={name ?? ""}
                    aria-labelledby={id + "-date-label"}
                    aria-describedby={id + "-date-hint"}
                    onChange={onChange}
                    data-testid={id}
                    min={minDate}
                    max={maxDate}
                    value={dateValue === null ? undefined : dateValue}
                    disabled={isDisabled}
                    required={required}
                />
            </div>
        </div>
    );
}

const DatePicker = forwardRef(DatePickerComponent);

// Alias for readability.
const debounce = setTimeout;

// export interface DateRangePickerProps extends Omit<DatePickerProps, 'value'> {
//   onStartDateChange?: (ev: React.ChangeEvent<HTMLInputElement>) => void;
//   onEndDateChange?: (ev: React.ChangeEvent<HTMLInputElement>) => void;
//   startDateLabel?: string;
//   endDateLabel?: string;
//   value?: DateRange;
//   disabled?: boolean;
// }

function DateRangePickerComponent(
    {
        id,
        startDateLabel,
        endDateLabel,
        minDate,
        maxDate,
        value,
        disabled,
        required,
        onStartDateChange,
        onEndDateChange
    },
    ref
) {
    const [internalDateRange, setInternalDateRange] = useState({
        start: minDate,
        end: maxDate
    });

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    function onStartDateChange(ev) {
        setInternalDateRange({ ...internalDateRange, start: ev.target.value || minDate });
        if (onStartDateChange) onStartDateChange(ev);
    }

    function onEndDateChange(ev) {
        setInternalDateRange({ ...internalDateRange, end: ev.target.value || maxDate });
        if (onEndDateChange) onEndDateChange(ev);
    }

    function clearValue() {
        setInternalDateRange(internalDateRange);
        startDateRef.current?.clearValue();
        endDateRef.current?.clearValue();

        // debounce to solve some funky weirdness with the date type input handling keyboard events after a reset.
        debounce(() => {
            startDateRef.current?.clearValue();
            endDateRef.current?.clearValue();
        }, 250);
    }

    function resetValue() {
        startDateRef.current?.resetValue();
        endDateRef.current?.resetValue();
    }

    function setValue(options = {}) {
        startDateRef.current?.setValue(options.start ?? "");
        endDateRef.current?.setValue(options.end ?? "");
    }

    function disable(value) {
        startDateRef.current?.disable(value);
        endDateRef.current?.disable(value);
    }

    useImperativeHandle(ref, () => {
        return {
            clearValue,
            resetValue,
            setValue,
            disable
        };
    });

    return (
        <div
            id={id}
            className="usa-date-range-picker"
            data-min-date={minDate}
            data-max-date={maxDate}
        >
            <DatePicker
                ref={startDateRef}
                id={`${id}-date-start`}
                minDate={minDate}
                maxDate={internalDateRange.end}
                onChange={onStartDateChange}
                label={startDateLabel || "Start date"}
                name="event-date-start"
                value={value?.start}
                disabled={disabled}
                required={required}
            />
            <DatePicker
                ref={endDateRef}
                id={`${id}-date-end`}
                minDate={internalDateRange.start}
                maxDate={maxDate}
                onChange={onEndDateChange}
                label={endDateLabel || "End date"}
                name="event-date-end"
                value={value?.end}
                disabled={disabled}
                required={required}
            />
        </div>
    );
}
const DateRangePicker = forwardRef(DateRangePickerComponent);
export default DateRangePicker;
