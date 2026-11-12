import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { renderChangeValues } from "../../../helpers/changeRequests.helpers";
import { convertCodeForDisplay, formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetNameForCanId } from "../../../hooks/lookup.hooks";
import TermTag from "../../ChangeRequests/TermTag";
import Tag from "../../UI/Tag";
import styles from "./ContractModificationEditCard.module.scss";

/**
 * @typedef {Object} ContractModificationEdit
 * @property {number} id
 * @property {string} modification_type - "MODIFIED_LOE" or "ADMIN_CHANGE"
 * @property {number | null} budget_line_item_id
 * @property {number | null} [services_component_id] - Set for a Services Component addition
 * @property {string} field - The edited field ("amount", "can_id", "date_needed", "delete", "services_component_create", or "project_officer_id" for a COR change)
 * @property {*} old_value
 * @property {*} new_value
 * @property {string | null} [old_display_name] - The "From" user's name for a COR change
 * @property {string | null} [new_display_name] - The "To" user's name for a COR change
 * @property {{id: number, full_name: string} | null} requested_by
 * @property {string | null} requested_on
 * @property {boolean} [in_review] - Part of the contract modification that is in review
 */

// Services Component add/delete (OPS-6440/OPS-3072) show the SC and what happened to it, with no
// From/To, per the design. "delete" is shared with a budget-line delete; which branch renders is
// decided by edit.services_component_id, not the field name.
const SERVICES_COMPONENT_CHANGE_LABELS = {
    services_component_create: "Add SC",
    delete: "Delete SC"
};

/**
 * One edit on an Awarded agreement that requires a contract modification.
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
    const servicesComponentChange =
        edit.services_component_id != null ? SERVICES_COMPONENT_CHANGE_LABELS[edit.field] : undefined;
    // The SC's display name, frozen on the row: the new SC for an addition, the deleted one otherwise.
    const servicesComponentName = edit.field === "services_component_create" ? edit.new_value : edit.old_value;
    // A COR change (OPS-3153) is agreement-level: no budget line, and From/To are user names.
    const isAgreementLevel = edit.field === "project_officer_id";

    return (
        <div
            className={`padding-205 bg-base-lightest border-1px border-base-light radius-md ${styles.card}`}
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
            {isAgreementLevel ? (
                <>
                    <TermTag
                        label="Change To"
                        value={convertCodeForDisplay("changeToTypes", edit.field)}
                        className="margin-0"
                    />
                    <TermTag
                        label="From"
                        value={edit.old_display_name ?? "TBD"}
                        className="margin-0"
                    />
                    <TermTag
                        label="To"
                        value={edit.new_display_name ?? "TBD"}
                        className="margin-0"
                    />
                </>
            ) : servicesComponentChange ? (
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
