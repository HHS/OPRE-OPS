import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tooltip from "../UI/USWDS/Tooltip";

/**
 * The disabled state of the agreement Edit button, shared by the Details and Budget Lines
 * headers. Rendered as a focusable span (role="button", aria-disabled, tabIndex=0) so the
 * tooltip fires on hover/focus despite there being no clickable button. Keeping the markup
 * here means a11y/markup fixes only have to be made once.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Tooltip label explaining why editing is disabled.
 * @param {("detail"|"budgetLines")} [props.variant="detail"] - Selects the alignment/icon
 *   sizing tuned for each header's row.
 * @returns {React.ReactElement}
 */
const DisabledEditButton = ({ label, variant = "detail" }) => {
    const isBudgetLines = variant === "budgetLines";
    const align = isBudgetLines ? "baseline" : "center";
    return (
        <Tooltip
            label={label}
            className={isBudgetLines ? "display-flex flex-align-baseline" : undefined}
        >
            <span
                id="edit-disabled"
                className={`hover:text-underline cursor-not-allowed text-disabled display-flex flex-align-${align}`}
                aria-disabled="true"
                data-cy="edit-disabled"
                role="button"
                tabIndex={0}
            >
                <FontAwesomeIcon
                    icon={faPen}
                    size={isBudgetLines ? "2x" : undefined}
                    className="height-2 width-2 margin-right-1"
                    style={isBudgetLines ? { position: "relative", top: "2px" } : undefined}
                    aria-hidden="true"
                    data-position="top"
                />
                <span>Edit</span>
            </span>
        </Tooltip>
    );
};

export default DisabledEditButton;
