import Tooltip from "../../USWDS/Tooltip";

/**
 * A button that is visually and functionally disabled while still showing a tooltip on
 * hover/focus. A plain `disabled` button swallows pointer and focus events, so the tooltip
 * never fires. This component wraps the button in a focusable `div` (role="button",
 * aria-disabled, tabIndex=0) that receives the events, while the inner button carries
 * `pointerEvents: none` so clicks do not reach it.
 *
 * This pattern is also used by FileUploadButton for its disabled+tooltip state.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Tooltip label text shown on hover/focus.
 * @param {string} [props.tooltipPosition="top"] - Tooltip position passed to `<Tooltip>`.
 * @param {string} [props.className="usa-button"] - CSS class for the inner `<button>`.
 * @param {string} [props.dataCy] - data-cy selector for the inner `<button>`.
 * @param {React.ReactNode} props.children - Button label content.
 * @returns {React.ReactElement}
 */
const DisabledButtonWithTooltip = ({ label, tooltipPosition = "top", className = "usa-button", dataCy, children }) => (
    <Tooltip
        label={label}
        position={tooltipPosition}
    >
        {/* Focusable wrapper so tooltip events fire despite the inner button being disabled */}
        <div
            tabIndex={0}
            role="button"
            aria-disabled="true"
            style={{ display: "inline-block", cursor: "not-allowed" }}
        >
            <button
                type="button"
                className={className}
                data-cy={dataCy}
                disabled={true}
                style={{ pointerEvents: "none" }}
            >
                {children}
            </button>
        </div>
    </Tooltip>
);

export default DisabledButtonWithTooltip;
