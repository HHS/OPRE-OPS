import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tag from "../../components/UI/Tag/Tag";

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
