import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import Tag from "../../Tag";

/**
 * @typedef {Object} LegendItemProps
 * @property {number} activeId - The active id.
 * @property {number} id - The id.
 * @property {string} label - The label.
 * @property {number} value - The value.
 * @property {string} color - The color.
 * @property {string} percent - The percent.
 * @property {string} tagStyleActive - The tag style active.
 */

/**
 * @component LegendItem
 * @param {LegendItemProps} props
 * @returns {JSX.Element}
 */
const LegendItem = ({ activeId, id, label, value, color, percent, tagStyleActive }) => {
    const isGraphActive = activeId === id;

    return (
        <div className="grid-row margin-top-2 font-12px">
            <div className="grid-col-7">
                <div className="display-flex flex-align-center">
                    <FontAwesomeIcon
                        icon={faCircle}
                        className={`height-1 width-1 margin-right-05`}
                        style={{ color: color }}
                    />

                    <span className={isGraphActive ? "fake-bold" : ""}>{label}</span>
                </div>
            </div>
            <div className="grid-col-4">
                <CurrencyFormat
                    value={value}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$ "}
                    renderText={(value) => <span className={isGraphActive ? "fake-bold" : ""}>{value}</span>}
                />
            </div>
            <div className="grid-col-1">
                <Tag
                    tagStyle="darkTextWhiteBackground"
                    text={percent}
                    label={label}
                    active={isGraphActive}
                    tagStyleActive={tagStyleActive}
                />
            </div>
        </div>
    );
};

export default LegendItem;
