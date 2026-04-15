import styles from "./styles.module.scss";
import { resolveLeftFlexWidth } from "./util";

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
 * @component  - line graph that shows two bars side by side (reversed layout).
 * @param {LineGraphProps} props
 * @returns {JSX.Element}
 */
const ReverseLineGraph = ({ data = [], setActiveId = () => {} }) => {
    const { color: leftColor, id: leftId, value: leftValue, percent: leftPercent } = data[0];
    const { color: rightColor, id: rightId, value: rightValue, percent: rightPercent } = data[1];

    const leftFlexWidth = resolveLeftFlexWidth(leftPercent, leftValue, rightValue);

    const leftIsFull =
        typeof leftPercent === "number" ? leftPercent >= 100 : (leftValue ?? 0) >= (leftValue ?? 0) + (rightValue ?? 0);
    const rightIsFull =
        typeof rightPercent === "number"
            ? rightPercent >= 100
            : (rightValue ?? 0) >= (leftValue ?? 0) + (rightValue ?? 0);

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
