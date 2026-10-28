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
            className="display-flex flex-align-start padding-2 bg-base-lightest border-1px border-base-light radius-md"
            data-cy="contract-modification-edit-card"
        >
            <div className="font-12px grid-col-2">
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
                className="grid-col-2 margin-0"
            />
            {servicesComponentChange ? (
                <>
                    <TermTag
                        label="SC"
                        value={servicesComponentName}
                        className="grid-col-2 margin-0"
                    />
                    <TermTag
                        label="Change To"
                        value={servicesComponentChange}
                        className="grid-col-2 margin-0"
                    />
                </>
            ) : (
                <>
                    <TermTag
                        label="BL ID"
                        value={edit.budget_line_item_id}
                        className="grid-col-2 margin-0"
                    />
                    <TermTag
                        label="Change To"
                        value={convertCodeForDisplay("changeToTypes", edit.field)}
                        className="grid-col-2 margin-0"
                    />
                    <TermTag
                        label="From"
                        value={oldValue}
                        className="grid-col-2 margin-0"
                    />
                    <TermTag
                        label="To"
                        value={newValue}
                        className="grid-col-2 margin-0"
                    />
                </>
            )}
            {edit.in_review && (
                <Tag
                    tagStyle="lightTextRedBackground"
                    className="margin-left-auto padding-x-05 text-no-wrap"
                    text="In Review"
                    data-cy="contract-modification-edit-in-review"
                />
            )}
        </div>
    );
};

export default ContractModificationEditCard;
