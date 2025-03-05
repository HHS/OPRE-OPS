import styles from "./styles.module.scss";

/**
 * @typedef {Object} Data
 * @property {number} id
 * @property {number} value
 * @property {string} color
 * @property {number} percent
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
    const { color: leftColor, id: leftId, percent: leftPercent } = data[0];
    const { color: rightColor, id: rightId, percent: rightPercent } = data[1];

    return (
        <div className={styles.barBox}>
            <div
                className={`${styles.leftBar} ${leftPercent >= 100 ? styles.leftBarFull : ""}`}
                style={{
                    flex: `0  1 ${leftPercent}%`,
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
                className={`${styles.rightBar} ${rightPercent >= 100 ? styles.rightBarFull : ""}`}
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
