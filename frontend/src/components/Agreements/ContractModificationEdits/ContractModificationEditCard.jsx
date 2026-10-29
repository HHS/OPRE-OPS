import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { renderChangeValues } from "../../../helpers/changeRequests.helpers";
import { convertCodeForDisplay, formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetNameForCanId } from "../../../hooks/lookup.hooks";
import TermTag from "../../ChangeRequests/TermTag";
import Tag from "../../UI/Tag";

/**
 * @typedef {Object} ContractModificationEdit
 * @property {number} id
 * @property {string} modification_type - e.g. "MODIFIED_LOE"
 * @property {number | null} budget_line_item_id
 * @property {number | null} [services_component_id] - Set for a Services Component addition
 * @property {string} field - The edited field ("amount", "can_id", "date_needed", "delete", "services_component_create")
 * @property {*} old_value
 * @property {*} new_value
 * @property {{id: number, full_name: string} | null} requested_by
 * @property {string | null} requested_on
 * @property {boolean} [in_review] - Part of the contract modification that is in review
 */

// Services Component additions (OPS-6440) show the SC and what happened to it, with no From/To,
// per the design.
const SERVICES_COMPONENT_CHANGE_LABELS = {
    services_component_create: "Add SC"
};

// Columns from the Figma "MODs Review Card" (Requested by, Modification Type, BL ID / SC, Change To,
// From, To, In Review). They're fr, not px, so they hit the Figma px at full width (850px for the
// six fields) but shrink and wrap when the card is narrower, e.g. at 200% zoom. Tracks never go
// below their content's minimum, so a value can't collapse under the In Review tag; From and To
// keep their full width so an amount like $175,000.00 isn't split mid-number. The In Review column
// has a fixed minimum so cards with and without the tag line up.
const CARD_COLUMNS =
    "148fr 166fr 132fr 115fr minmax(max-content, 134fr) minmax(max-content, 155fr) minmax(4.5rem, auto)";

/**
 * One approved edit on an Awarded agreement that requires a contract modification.
 *
 * @component
 * @param {Object} props
 * @param {ContractModificationEdit} props.edit
 * @returns {React.ReactElement}
 */
const ContractModificationEditCard = ({ edit }) => {
    const changeTo = { [edit.field]: { old: edit.old_value, new: edit.new_value } };
    const oldCan = useGetNameForCanId(edit.field === "can_id" ? edit.old_value : undefined);
    const newCan = useGetNameForCanId(edit.field === "can_id" ? edit.new_value : undefined);
    const { oldValue, newValue } = renderChangeValues(edit.field, changeTo, oldCan, newCan);
    const servicesComponentChange = SERVICES_COMPONENT_CHANGE_LABELS[edit.field];
    // The SC's display name, frozen on the row: the new SC for an addition, the deleted one otherwise.
    const servicesComponentName = edit.field === "services_component_create" ? edit.new_value : edit.old_value;

    return (
        <div
            className="padding-205 bg-base-lightest border-1px border-base-light radius-md"
            style={{ display: "grid", gridTemplateColumns: CARD_COLUMNS, alignItems: "start" }}
            data-cy="contract-modification-edit-card"
        >
            <div className="font-12px">
                <dl className="margin-0">
                    <dt className="text-base-dark">Requested by</dt>
                    <dd className="margin-0 text-bold">{edit.requested_by?.full_name}</dd>
                </dl>
                <div className="text-base-dark display-flex flex-align-center margin-top-2">
                    <FontAwesomeIcon
                        icon={faClock}
                        className="height-2 width-2 margin-right-1"
                        aria-hidden={true}
                    />
                    {formatDateToMonthDayYear(edit.requested_on)}
                </div>
            </div>
            <TermTag
                label="Modification Type"
                value={convertCodeForDisplay("modificationEditType", edit.modification_type)}
                className="margin-0"
            />
            {servicesComponentChange ? (
                <>
                    <TermTag
                        label="SC"
                        value={servicesComponentName}
                        className="margin-0"
                    />
                    <TermTag
                        label="Change To"
                        value={servicesComponentChange}
                        className="margin-0"
                    />
                </>
            ) : (
                <>
                    <TermTag
                        label="BL ID"
                        value={edit.budget_line_item_id}
                        className="margin-0"
                    />
                    <TermTag
                        label="Change To"
                        value={convertCodeForDisplay("changeToTypes", edit.field)}
                        className="margin-0"
                    />
                    <TermTag
                        label="From"
                        value={oldValue}
                        className="margin-0"
                    />
                    <TermTag
                        label="To"
                        value={newValue}
                        className="margin-0"
                    />
                </>
            )}
            {edit.in_review && (
                <Tag
                    tagStyle="lightTextRedBackground"
                    // Inline nowrap: Tag's own inline whiteSpace would override a class.
                    style={{ gridColumn: "-2 / -1", justifySelf: "end", whiteSpace: "nowrap" }}
                    text="In Review"
                    dataCy="contract-modification-edit-in-review"
                />
            )}
        </div>
    );
};

export default ContractModificationEditCard;
