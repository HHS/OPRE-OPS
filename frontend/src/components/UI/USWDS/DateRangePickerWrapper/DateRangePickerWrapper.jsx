import React from "react";
import PropTypes from "prop-types";
import dateRangePicker from "@uswds/uswds/js/usa-date-range-picker";

/**
 * A date range picker helps users select a range between two dates.
 * This component wraps the USWDS date range picker.
 * @component
 * @param {Object} props - The properties object.
 * @param {string} props.id - The ID of the date range picker.
 * @param {React.ReactNode} props.children - The child components to be rendered.
 * @param {string} [props.className] - The CSS class name to apply.
 * @returns {JSX.Element} The date range picker wrapper.
 */
function DateRangePickerWrapper({ id, children, className = "" }) {
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
            className={`usa-date-range-picker ${className}`}
        >
            {children}
        </div>
    );
}

DateRangePickerWrapper.propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};
export default DateRangePickerWrapper;
