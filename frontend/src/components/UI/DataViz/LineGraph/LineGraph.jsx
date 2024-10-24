import PropTypes from "prop-types";
import styles from "./styles.module.scss";
import { useEffect, useState } from "react";
import { calculateRatio } from "./util";

/**
 * @typedef {Object} Data
 * @property {number} id
 * @property {number} value
 * @property {string} color
 */

/**
 * @description A line graph that shows two bars side by side.
 * @component
 * @param {Object} props
 * @param {Data[]} props.data
 * @param {Function} [props.setActiveId]
 * @param {boolean} [props.isStriped]
 * @param {boolean} [props.overBudget]
 * @returns {JSX.Element}
 */
const LineGraph = ({ data = [], setActiveId = () => {}, isStriped = false, overBudget = false }) => {
    const [ratio, setRatio] = useState(1);
    const leftBar = data[0].value;
    const rightBar = data[1].value;

    useEffect(() => {
        const calculatedRatio = calculateRatio({ received: leftBar, expected: rightBar });

        // css/flex will throw a warning here if depending on the data calculatedRatio is NaN
        if (calculatedRatio !== undefined && !Number.isNaN(calculatedRatio)) {
            setRatio(calculatedRatio);
        }
    }, [leftBar, rightBar]);

    return (
        <div className={styles.barBox}>
            <div
                className={`${styles.leftBar} ${styles.dottedBar}`}
                style={{
                    flex: ratio,
                    backgroundColor: data[0].color,
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
                onMouseEnter={() => setActiveId(data[0].id)}
                onMouseLeave={() => setActiveId(0)}
            />
            <div
                className={`${styles.rightBar} ${ratio === 0 ? styles.rightBarFull : ""}`}
                style={{ backgroundColor: data[1].color }}
                onMouseEnter={() => setActiveId(data[1].id)}
                onMouseLeave={() => setActiveId(0)}
            />
        </div>
    );
};

LineGraph.propTypes = {
    data: PropTypes.array.isRequired,
    setActiveId: PropTypes.func,
    isStriped: PropTypes.bool,
    overBudget: PropTypes.bool
};
export default LineGraph;
