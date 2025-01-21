import { useEffect, useState } from "react";
import styles from "./styles.module.scss";

/**
 * Calculates the ratio of received to total.
 *
 * @param {Object} params - The parameters object.
 * @param {number} params.received - The received value.
 * @param {number} params.total - The total value.
 * @returns {number} The ratio of received to total. Returns 1 if total is 0.
 */
const calculateRatio = ({ received, total }) => {
    if (received === 0) {
        return 0;
    } else {
        return received / total;
    }
};
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
 */

/**
 * @component  - line graph that shows two bars side by side.
 * @param {LineGraphProps} props
 * @returns {JSX.Element}
 */

const ReverseLineGraph = ({ data = [], setActiveId = () => {} }) => {
    const [ratio, setRatio] = useState(1);
    const { color: leftColor, id: leftId, value: leftValue } = data[0];
    const { color: rightColor, id: rightId, value: rightValue } = data[1];

    useEffect(() => {
        const calculatedRatio = calculateRatio({ received: leftValue, total: rightValue }); // Pass object with named parameters

        // css/flex will throw a warning here if depending on the data calculatedRatio is NaN
        if (calculatedRatio !== undefined && !Number.isNaN(calculatedRatio)) {
            setRatio(calculatedRatio);
        }
    }, [leftValue, rightValue]);

    return (
        <div className={styles.barBox}>
            {leftValue > 0 && (
                <div
                    className={`${styles.leftBar}`}
                    style={{
                        flex: `0  1 ${ratio * 100}%`,
                        backgroundColor: leftColor,
                        borderTopRightRadius: ratio === 1 ? "4px" : "0",
                        borderBottomRightRadius: ratio === 1 ? "4px" : "0"
                    }}
                    onMouseEnter={() => setActiveId(leftId)}
                    onMouseLeave={() => setActiveId(0)}
                />
            )}
            <div
                className={`${styles.rightBar} ${leftValue === 0 ? styles.rightBarFull : ""}`}
                style={{
                    flex: leftValue === 0 ? "100%" : "",
                    backgroundColor: rightColor,
                    backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 5px,
                        var(--data-viz-budget-graph-1) 5px,
                        var(--data-viz-budget-graph-1) 6px
                    )`,
                    borderTopLeftRadius: "4px",
                    borderBottomLeftRadius: "4px"
                }}
                onMouseEnter={() => setActiveId(rightId)}
                onMouseLeave={() => setActiveId(0)}
            />
        </div>
    );
};

export default ReverseLineGraph;
