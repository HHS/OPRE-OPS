import React from "react";
import dateRangePicker from "@uswds/uswds/js/usa-date-range-picker";

/**
 * A date range picker helps users select a range between two dates.
 */
function DateRangePickerWrapper({ id, children }) {
    const dateRangePickerRef = React.useRef(null);
    React.useLayoutEffect(() => {
        const dateRangePickerElement = dateRangePickerRef.current;
        dateRangePicker.on(dateRangePickerElement);
        return () => dateRangePicker.off(dateRangePickerElement);
    });

    return (
        <div
            id={id}
            ref={dateRangePickerRef}
            className="usa-date-range-picker"
        >
            {children}
        </div>
    );
}

export default DateRangePickerWrapper;
