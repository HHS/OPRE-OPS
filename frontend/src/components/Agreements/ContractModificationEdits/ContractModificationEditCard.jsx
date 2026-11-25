import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    getContractModificationEditTerms,
    isExecuteSelection
} from "../../../helpers/contractModificationEdits.helpers";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { useGetNameForCanId } from "../../../hooks/lookup.hooks";
import TermTag from "../../ChangeRequests/TermTag";
import Tag from "../../UI/Tag";
import styles from "./ContractModificationEditCard.module.scss";

/**
 * @typedef {Object} ContractModificationEdit
 * @property {number} id
 * @property {string} [modification_type] - "MODIFIED_LOE" or "ADMIN_CHANGE". Omitted for a budget
 *   line selected to execute (Planned -> Executing): that's the approval action itself, not a
 *   tracked edit, so there's no modification type to show.
 * @property {number | null} budget_line_item_id
 * @property {number | null} [services_component_id] - Set for a Services Component addition
 * @property {number | string | null} [amount] - The budget line's total, shown for an execute card
 * @property {string} field - The edited field ("amount", "can_id", "date_needed", "delete", "services_component_create", a Services Component's "period_start" / "period_end", or "project_officer_id" for a COR change)
 * @property {*} old_value
 * @property {*} new_value
 * @property {string | null} [old_display_name] - The "From" user's name for a COR change
 * @property {string | null} [new_display_name] - The "To" user's name for a COR change
 * @property {string | null} [services_component_display_name] - The SC's name for its period-of-performance edits
 * @property {{id: number, full_name: string, display_name?: string} | null} requested_by
 * @property {string | null} requested_on
 * @property {boolean} [in_review] - Part of the contract modification that is in review
 */

/**
 * One edit on an Awarded agreement that requires a contract modification.
 *
 * @component
 * @param {Object} props
 * @param {ContractModificationEdit} props.edit
 * @returns {React.ReactElement}
 */
const ContractModificationEditCard = ({ edit }) => {
    const oldCan = useGetNameForCanId(edit.field === "can_id" ? edit.old_value : undefined);
    const newCan = useGetNameForCanId(edit.field === "can_id" ? edit.new_value : undefined);
    const terms = getContractModificationEditTerms(edit, { oldCan, newCan });
    const executeSelection = isExecuteSelection(edit);
    const budgetLineGroup = terms.filter((term) => term.group === "budget-line");
    const renderTerm = (term) => (
        <TermTag
            key={term.label}
            label={term.label}
            {...(term.bliStatus !== undefined ? { bliStatus: term.bliStatus } : { value: term.value })}
            className="margin-0"
        />
    );

    return (
        <div
            className={`padding-205 bg-base-lightest border-1px border-base-light radius-md ${styles.card} ${
                executeSelection ? styles.executeCard : ""
            }`}
            data-cy="contract-modification-edit-card"
        >
            <div className="font-12px">
                <dl className="margin-0">
                    <dt className="text-base-dark">Requested by</dt>
                    <dd className="margin-0 text-bold">
                        {edit.requested_by?.display_name ?? edit.requested_by?.full_name}
                    </dd>
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
            {budgetLineGroup.length > 0 && (
                <div
                    className="display-flex"
                    style={{ gap: "1.5rem" }}
                >
                    {budgetLineGroup.map(renderTerm)}
                </div>
            )}
            {terms.filter((term) => term.group === undefined).map(renderTerm)}
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
