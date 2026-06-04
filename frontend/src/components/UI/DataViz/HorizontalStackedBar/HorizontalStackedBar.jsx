import CurrencyFormat from "react-currency-format";
import styles from "./HorizontalStackedBar.module.scss";

/**
 * @typedef {Object} SegmentData
 * @property {number} id - Unique identifier for the segment
 * @property {number|string} percent - Display percent: a rounded integer, or the string "<1"
 * @property {string} color - CSS color variable
 * @property {string} label - Portfolio name for accessibility
 * @property {string} abbreviation - Portfolio abbreviation
 * @property {number} value - Dollar amount for this segment
 * @property {boolean} [isPlaceholder] - Whether this is a layout placeholder (filtered out before rendering)
 */

/**
 * Horizontal stacked bar graph supporting multiple segments.
 *
 * Bar widths are derived from the proportional `value` of each segment
 * (not from the display `percent` string), so segments with a string percent
 * like "<1" still render correctly.
 *
 * @component
 * @param {Object} props
 * @param {SegmentData[]} props.data - Array of segment data
 * @param {Function} props.setActiveId - Callback for hover interactions
 * @returns {JSX.Element}
 */
const HorizontalStackedBar = ({ data, setActiveId = () => {} }) => {
    // Filter on value > 0 (always numeric) — percent can be a display string
    // like "<1" and must not be used for this boolean check.
    const segments = data?.filter((item) => !item.isPlaceholder && item.value > 0) ?? [];

    if (segments.length === 0) {
        return null;
    }

    const total = segments.reduce((sum, item) => sum + item.value, 0);

    const handleMouseEnter = (id) => {
        setActiveId(id);
    };

    const handleMouseLeave = () => {
        setActiveId(null);
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
                const rawWidth = total > 0 ? (segment.value / total) * 100 : 0;

                return (
                    <div
                        key={segment.id}
                        className={styles.segment}
                        style={{
                            flexBasis: `${rawWidth}%`,
                            minWidth: rawWidth > 0 && rawWidth < 1 ? "4px" : undefined,
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
