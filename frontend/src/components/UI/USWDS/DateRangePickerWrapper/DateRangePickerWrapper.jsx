import React, { useRef } from "react";
import PropTypes from "prop-types";
import dateRangePicker from "@uswds/uswds/js/usa-date-range-picker";

/**
 * DateRangePickerWrapper is a component that wraps the USWDS date range picker functionality.
 * It initializes the date range picker on a referenced div and cleans up when the component unmounts.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.id - The ID for the date range picker element, must be unique.
 * @param {React.ReactNode} props.children - The child components, typically two DatePicker components.
 * @param {string} [props.className=""] - Optional additional CSS classes to apply to the wrapper.
 * @returns {JSX.Element} The rendered DateRangePickerWrapper component.
 */
// eslint-disable-next-line react-refresh/only-export-components
function DateRangePickerWrapper({ id, children, className }) {
    const dateRangePickerRef = useRef(null);

    React.useEffect(() => {
        const dateRangePickerElement = dateRangePickerRef.current;
        if (dateRangePickerElement) {
            dateRangePicker.on(dateRangePickerElement);
            // Ensure to properly clean up the event listeners and enhancements
            return () => {
                dateRangePicker.off(dateRangePickerElement);
            };
        }
    }, []); // This ensures the code runs only once after the component mounts

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

// eslint-disable-next-line react-refresh/only-export-components
export default React.memo(DateRangePickerWrapper, (prevProps, nextProps) => {
    // Return true if passing nextProps to render would return
    // the same result as passing prevProps to render,
    // otherwise return false
    return (
        prevProps.id === nextProps.id &&
        prevProps.className === nextProps.className &&
        React.Children.count(prevProps.children) === React.Children.count(nextProps.children)
    );
});
