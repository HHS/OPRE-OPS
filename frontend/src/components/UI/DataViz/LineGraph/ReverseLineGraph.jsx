import styles from "./styles.module.scss";

/**
 * @typedef {Object} Data
 * @property {number} id
 * @property {number} value
 * @property {string} color
 * @property {number|string} percent - Display percent: integer, or ">99" / "<1"
 */

/**
 * @typedef {Object} LineGraphProps
 * @property {Data[]} data
 * @property {Function} [props.setActiveId]
 */

/**
 * @component  - line graph that shows two bars side by side.
 *
 * Bar widths are derived from proportional `value` fields so that display
 * strings like ">99" or "<1" in the `percent` field never break CSS layout.
 *
 * @param {LineGraphProps} props
 * @returns {JSX.Element}
 */
const ReverseLineGraph = ({ data = [], setActiveId = () => {} }) => {
    const { color: leftColor, id: leftId, value: leftValue, percent: leftPercent } = data[0];
    const { color: rightColor, id: rightId, value: rightValue, percent: rightPercent } = data[1];

    // Derive numeric width from value so CSS layout is never broken by a
    // display-string percent like ">99" or "<1".
    const total = (leftValue ?? 0) + (rightValue ?? 0);
    const rawLeftWidth = total > 0 ? ((leftValue ?? 0) / total) * 100 : 0;
    const rawRightWidth = total > 0 ? ((rightValue ?? 0) / total) * 100 : 0;

    // Apply a minimum visible floor of 2% for non-zero bars so a tiny sliver
    // is never invisible. Cap the opposing bar so the two widths stay coherent.
    const MIN_WIDTH = 2;
    let leftFlexWidth = rawLeftWidth;
    if (rawLeftWidth > 0 && rawLeftWidth < MIN_WIDTH) {
        leftFlexWidth = MIN_WIDTH;
    } else if (rawRightWidth > 0 && rawRightWidth < MIN_WIDTH) {
        leftFlexWidth = 100 - MIN_WIDTH;
    }

    // Use value comparison for the "full bar" CSS class — not the display string.
    const leftIsFull = total > 0 && (leftValue ?? 0) >= total;
    const rightIsFull = total > 0 && (rightValue ?? 0) >= total;

    // Suppress leftPercent/rightPercent unused-variable warnings — these are
    // intentionally kept in the destructure for callers that still pass them.
    void leftPercent;
    void rightPercent;

    return (
        <div className={styles.barBox}>
            {leftValue > 0 && (
                <div
                    data-testid="line-graph-left-bar"
                    className={`${styles.leftBar} ${leftIsFull ? styles.leftBarFull : ""}`}
                    style={{
                        flex: `0 1 ${leftFlexWidth}%`,
                        backgroundColor: leftColor
                    }}
                    onMouseEnter={() => setActiveId(leftId)}
                    onMouseLeave={() => setActiveId(0)}
                />
            )}
            <div
                className={`${styles.rightBar} ${rightIsFull ? styles.rightBarFull : ""}`}
                style={{
                    backgroundColor: rightColor,
                    backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 5px,
                        var(--data-viz-budget-graph-1) 5px,
                        var(--data-viz-budget-graph-1) 6px
                    )`
                }}
                onMouseEnter={() => setActiveId(rightId)}
                onMouseLeave={() => setActiveId(0)}
            />
        </div>
    );
};

export default ReverseLineGraph;
