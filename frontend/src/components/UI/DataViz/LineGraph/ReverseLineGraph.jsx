import styles from "./styles.module.scss";

/**
 * Calculates the ratio of received to total.
 *
 * @param {Object} params - The parameters object.
 * @param {number} params.received - The received value.
 * @param {number} params.total - The total value.
 * @returns {number} The ratio of received to total. Returns 1 if total is 0.
 */

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
 */

/**
 * @component  - line graph that shows two bars side by side.
 * @param {LineGraphProps} props
 * @returns {JSX.Element}
 */

const ReverseLineGraph = ({ data = [], setActiveId = () => {} }) => {
    const { color: leftColor, id: leftId, value: leftValue, percent: leftPercent } = data[0];
    const { color: rightColor, id: rightId, percent: rightPercent } = data[1];

    return (
        <div className={styles.barBox}>
            {leftValue > 0 && (
                <div
                    className={`${styles.leftBar} ${styles.dottedBar} ${leftPercent >= 100 ? styles.leftBarFull : ""}`}
                    style={{
                        flex: `0  1 ${leftPercent}%`,
                        backgroundColor: leftColor
                    }}
                    onMouseEnter={() => setActiveId(leftId)}
                    onMouseLeave={() => setActiveId(0)}
                />
            )}
            <div
                className={`${styles.rightBar} ${rightPercent >= 100 ? styles.rightBarFull : ""}`}
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
