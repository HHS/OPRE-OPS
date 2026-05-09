import styles from "./styles.module.scss";
import { resolveLeftFlexWidth } from "./util";

/**
 * @typedef {Object} Data
 * @property {number} id
 * @property {number} value
 * @property {string} color
 * @property {number|string} percent - Display percent: integer, or "<1"
 */

/**
 * @typedef {Object} LineGraphProps
 * @property {Data[]} data
 * @property {Function} [props.setActiveId]
 * @property {boolean} [props.isStriped]
 * @property {boolean} [props.overBudget]
 */

/**
 * @component  - line graph that shows two bars side by side.
 * @param {LineGraphProps} props
 * @returns {JSX.Element}
 */
const LineGraph = ({ data = [], setActiveId = () => {}, isStriped = false, overBudget = false }) => {
    const { color: leftColor, id: leftId, value: leftValue, percent: leftPercent } = data[0];
    const { color: rightColor, id: rightId, value: rightValue, percent: rightPercent } = data[1];

    const leftFlexWidth = resolveLeftFlexWidth(leftPercent, leftValue, rightValue);

    // Use numeric percent for full-bar class when available.
    // Fallback: "full" when the other side has no value (rightValue <= 0 / leftValue <= 0).
    const leftIsFull = typeof leftPercent === "number" ? leftPercent >= 100 : (rightValue ?? 0) <= 0;
    const rightIsFull = typeof rightPercent === "number" ? rightPercent >= 100 : (leftValue ?? 0) <= 0;

    return (
        <div className={styles.barBox}>
            <div
                data-testid="line-graph-left-bar"
                className={`${styles.leftBar} ${leftIsFull ? styles.leftBarFull : ""}`}
                style={{
                    flex: `0 1 ${leftFlexWidth}%`,
                    backgroundColor: leftColor,
                    backgroundImage:
                        isStriped && !overBudget
                            ? `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 5px,
                        var(--data-viz-budget-graph-1) 5px,
                var(--data-viz-budget-graph-1) 6px
            )`
                            : "none"
                }}
                onMouseEnter={() => setActiveId(leftId)}
                onMouseLeave={() => setActiveId(0)}
            />

            <div
                data-testid="line-graph-right-bar"
                className={`${styles.rightBar} ${rightIsFull ? styles.rightBarFull : ""}`}
                style={{
                    backgroundColor: rightColor,
                    backgroundImage:
                        isStriped && !overBudget
                            ? `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 5px,
                  var(--data-viz-budget-graph-1) 5px,
                  var(--data-viz-budget-graph-1) 6px
              )`
                            : "none"
                }}
                onMouseEnter={() => setActiveId(rightId)}
                onMouseLeave={() => setActiveId(0)}
            />
        </div>
    );
};

export default LineGraph;
