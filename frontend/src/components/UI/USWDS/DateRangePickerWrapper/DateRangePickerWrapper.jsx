import React from "react";
import dateRangePicker from "@uswds/uswds/js/usa-date-range-picker";

/**
 * A date range picker helps users select a range between two dates.
 */
function DateRangePickerWrapper({ id, children }) {
    const [isMounted, setIsMounted] = React.useState(false);
    const dateRangePickerRef = React.useRef(null);

    React.useEffect(() => {
        if (isMounted) {
            const dateRangePickerElement = dateRangePickerRef.current;
            dateRangePicker.on(dateRangePickerElement);
            return () => dateRangePicker.off(dateRangePickerElement);
        }
    }, [isMounted]); // Depend on the mounting state

    React.useEffect(() => {
        setIsMounted(true); // Set mounted state after initial render
        return () => setIsMounted(false); // Clean up on unmount
    }, []);

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
