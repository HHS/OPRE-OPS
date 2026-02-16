import CurrencyFormat from "react-currency-format";
import styles from "./HorizontalStackedBar.module.scss";

/**
 * @typedef {Object} SegmentData
 * @property {number} id - Unique identifier for the segment
 * @property {number} percent - Percentage width (0-100)
 * @property {string} color - CSS color variable
 * @property {string} label - Portfolio name for accessibility
 * @property {string} abbreviation - Portfolio abbreviation
 * @property {number} value - Dollar amount for this segment
 * @property {boolean} [isPlaceholder] - Whether this is a layout placeholder (filtered out before rendering)
 */

/**
 * Horizontal stacked bar graph supporting multiple segments
 * @component
 * @param {Object} props
 * @param {SegmentData[]} props.data - Array of segment data
 * @param {Function} props.setActiveId - Callback for hover interactions
 * @returns {JSX.Element}
 */
const HorizontalStackedBar = ({ data, setActiveId = () => {} }) => {
    const segments = data?.filter((item) => !item.isPlaceholder && item.percent > 0) ?? [];

    if (segments.length === 0) {
        return null;
    }

    const handleMouseEnter = (id) => {
        setActiveId(id);
    };

    const handleMouseLeave = () => {
        setActiveId(0);
    };

    const handleKeyDown = (e, id) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setActiveId(id);
        }
    };

    return (
        <div className={styles.stackedBarContainer}>
            {segments.map((segment) => {
                // Ensure minimum width for tiny percentages
                const minWidth = segment.percent > 0 && segment.percent < 1 ? 1 : segment.percent;

                return (
                    <div
                        key={segment.id}
                        className={styles.segment}
                        style={{
                            flexBasis: `${minWidth}%`,
                            backgroundColor: segment.color
                        }}
                        onMouseEnter={() => handleMouseEnter(segment.id)}
                        onMouseLeave={handleMouseLeave}
                        onFocus={() => handleMouseEnter(segment.id)}
                        onBlur={handleMouseLeave}
                        onKeyDown={(e) => handleKeyDown(e, segment.id)}
                        tabIndex={0}
                        role="button"
                        aria-label={`${segment.abbreviation}: ${segment.percent}% of budget`}
                        data-cy={`portfolio-bar-segment-${segment.abbreviation}`}
                        data-testid={`portfolio-bar-segment-${segment.abbreviation}`}
                    >
                        <span className="usa-sr-only">
                            {segment.label}:{" "}
                            <CurrencyFormat
                                value={segment.value}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={2}
                                fixedDecimalScale
                            />{" "}
                            ({segment.percent}%)
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default HorizontalStackedBar;
