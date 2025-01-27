import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { calculateRatio } from "./util";

/**
 * @typedef {Object} Data
 * @property {number} id
 * @property {number} value
 * @property {string} color
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
    const [ratio, setRatio] = useState(1);
    const { color: leftColor, id: leftId, value: leftValue } = data[0];
    const { color: rightColor, id: rightId, value: rightValue } = data[1];

    useEffect(() => {
        const calculatedRatio = calculateRatio({ received: leftValue, expected: rightValue });

        // css/flex will throw a warning here if depending on the data calculatedRatio is NaN
        if (calculatedRatio !== undefined && !Number.isNaN(calculatedRatio)) {
            setRatio(calculatedRatio);
        }
    }, [leftValue, rightValue]);

    return (
        <div className={styles.barBox}>
            <div
                className={`${styles.leftBar} ${styles.dottedBar}`}
                style={{
                    flex: `0  1 ${ratio * 100}%`,
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
                className={`${styles.rightBar} ${ratio === 0 ? styles.rightBarFull : ""}`}
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
