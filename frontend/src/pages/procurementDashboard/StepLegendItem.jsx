import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tag from "../../components/UI/Tag/Tag";

/**
 * @typedef {Object} StepLegendItemProps
 * @property {number} id - The step id.
 * @property {number} activeId - The currently hovered/active step id.
 * @property {string} label - The step label (e.g. "Step 1").
 * @property {number} value - The number of agreements in this step.
 * @property {string} color - CSS color for the legend dot.
 * @property {number} percent - The percentage of total agreements.
 */

/**
 * @component StepLegendItem
 * @param {StepLegendItemProps} props
 * @returns {JSX.Element}
 */
const StepLegendItem = ({ id, activeId, label, value, color, percent }) => {
    const isActive = activeId === id;
    return (
        <div className="display-flex flex-justify margin-top-2 font-12px flex-align-center">
            <div className="display-flex flex-align-center flex-1">
                <FontAwesomeIcon
                    icon={faCircle}
                    className="height-1 width-1 margin-right-05"
                    style={{ color }}
                    title={`${label} indicator`}
                    aria-label={`${label} indicator`}
                    role="img"
                />
                <span className={isActive ? "fake-bold" : ""}>{label}</span>
            </div>
            <span className={`flex-1 text-center ${isActive ? "fake-bold" : ""}`}>{value}</span>
            <div className="flex-1 text-right">
                <Tag
                    tagStyle="darkTextWhiteBackground"
                    text={`${percent}%`}
                    label={label}
                    active={isActive}
                    style={isActive ? { backgroundColor: color, color: "white" } : {}}
                />
            </div>
        </div>
    );
};

export default StepLegendItem;
