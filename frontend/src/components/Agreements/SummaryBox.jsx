/**
 * Generic summary box component that displays two label-value pairs side-by-side
 * @param {Object} props
 * @param {string} props.leftLabel - Label for the left field
 * @param {string|number} props.leftValue - Value for the left field
 * @param {string} props.rightLabel - Label for the right field
 * @param {string|number} props.rightValue - Value for the right field
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.dataCy] - Data-cy attribute for testing
 * @param {string} [props.width] - Custom width (omit to use parent container width)
 * @param {string} [props.minHeight] - Custom min-height
 * @returns {JSX.Element}
 */
const SummaryBox = ({
    leftLabel,
    leftValue,
    rightLabel,
    rightValue,
    className = "",
    dataCy,
    width,
    minHeight,
    // Legacy prop for backward compatibility
    selectedProductServiceCode
}) => {
    // Support legacy usage
    const finalLeftLabel = leftLabel || "NAICS Code";
    const finalLeftValue = leftValue !== undefined ? leftValue : selectedProductServiceCode?.naics;
    const finalRightLabel = rightLabel || "Program Support Code";
    const finalRightValue = rightValue !== undefined ? rightValue : selectedProductServiceCode?.support_code;

    // Only apply inline styles if width/minHeight are provided
    const inlineStyle = {};
    if (width) inlineStyle.width = width;
    if (minHeight) inlineStyle.minHeight = minHeight;

    return (
        <div
            className={`bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-sm ${className}`}
            style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
            data-cy={dataCy}
        >
            <dl className="margin-0 padding-y-2 padding-x-105 display-flex flex-justify">
                <div>
                    <dt className="margin-0 text-base-dark">{finalLeftLabel}</dt>
                    <dd className="text-semibold margin-0">{finalLeftValue}</dd>
                </div>
                <div>
                    <dt className="margin-0 text-base-dark">{finalRightLabel}</dt>
                    <dd className="text-semibold margin-0">{finalRightValue}</dd>
                </div>
            </dl>
        </div>
    );
};

export default SummaryBox;
