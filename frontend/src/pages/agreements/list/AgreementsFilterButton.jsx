import "./AgreementsFilterButton.scss";
import icons from "../../../uswds/img/sprite.svg";

/**
 * Page for the Agreements List.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsFilterButton = () => {
    return (
        <button className="usa-button display-flex flex-align-center" onClick={() => {}}>
            <svg
                className="height-3 width-3 margin-right-05 hover: cursor-pointer usa-tooltip"
                style={{ fill: "white" }}
            >
                <use xlinkHref={`${icons}#filter_list`}></use>
            </svg>
            <span>Filters</span>
        </button>
    );
};

export default AgreementsFilterButton;
