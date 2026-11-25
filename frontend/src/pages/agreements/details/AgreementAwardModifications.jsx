import { useGetAgreementAwardHistoryByIdQuery, useGetVersionQuery } from "../../../api/opsAPI";
import ContractModificationEdits from "../../../components/Agreements/ContractModificationEdits";
import Accordion from "../../../components/UI/Accordion/Accordion";
import TermTag from "../../../components/UI/Term/TermTag";
import { getAwardModificationSections } from "../../../helpers/awardModificationHistory.helpers";
import { getContractModificationEditTerms } from "../../../helpers/contractModificationEdits.helpers";
import { useGetNameForCanId } from "../../../hooks/lookup.hooks";

/**
 * One of a contract mod's edits, as label/value pills in the history accordion's style
 * (OPS-6513). Uses the same terms as the edit card.
 *
 * @component
 * @param {Object} props
 * @param {import("../../../components/Agreements/ContractModificationEdits/ContractModificationEditCard").ContractModificationEdit} props.edit
 * @returns {React.ReactElement}
 */
const AwardModificationEdit = ({ edit }) => {
    const oldCan = useGetNameForCanId(edit.field === "can_id" ? edit.old_value : undefined);
    const newCan = useGetNameForCanId(edit.field === "can_id" ? edit.new_value : undefined);
    return (
        <dl
            className="display-flex flex-wrap margin-0"
            style={{ gap: "0.75rem 2rem" }}
            data-cy="award-mod-edit"
            data-testid="award-mod-edit"
        >
            {getContractModificationEditTerms(edit, { oldCan, newCan }).map((term) => (
                <TermTag
                    key={term.label}
                    term={term.label}
                    description={term.value == null || term.value === "" ? undefined : String(term.value)}
                />
            ))}
        </dl>
    );
};

/**
 * @typedef {Object} AgreementAwardModificationsProps
 * @property {import("../../../types/AgreementTypes").Agreement | undefined} agreement - The agreement (needs at least an id).
 */

/**
 * Award & Modification History tab for Contract and AA agreements. Renders one
 * accordion per procurement cycle: the initial award once its award is approved, and each
 * contract mod from the Division Director's approval (OPS-6513). Each shows a fixed grid of
 * award/mod fields; a contract mod also lists the edits it batched.
 *
 * @component
 * @param {AgreementAwardModificationsProps} props
 * @returns {React.ReactElement}
 */
const AgreementAwardModifications = ({ agreement }) => {
    const agreementId = agreement?.id;
    const {
        data: records,
        isLoading,
        isError
    } = useGetAgreementAwardHistoryByIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });

    // The "Contract Modifications" section only applies once the agreement is awarded, and
    // follows the backend's ENABLE_MODIFIED_LOE_EDITS capability (OPS-3072).
    const { data: versionData } = useGetVersionQuery();
    const showContractModifications = Boolean(agreement?.is_awarded && versionData?.enable_modified_loe_edits);
    const contractModifications = showContractModifications ? (
        <ContractModificationEdits
            agreementId={agreementId}
            isAgreementEditable={Boolean(agreement?._meta?.isEditable)}
            isActiveContractModLocked={Boolean(agreement?.is_active_contract_mod_locked)}
        />
    ) : null;

    const heading = (
        <>
            {contractModifications}
            <h2 className="font-sans-lg">Award &amp; Modification History</h2>
        </>
    );

    if (isLoading) {
        return (
            <>
                {heading}
                <div>Loading award &amp; modification history...</div>
            </>
        );
    }

    if (isError || !agreementId) {
        return (
            <>
                {heading}
                <div>Error loading award &amp; modification history.</div>
            </>
        );
    }

    const awardHistory = records ?? [];

    return (
        <>
            {heading}
            {awardHistory.length === 0 ? (
                <p
                    className="font-sans-sm margin-bottom-4"
                    data-cy="award-mod-empty-state"
                >
                    There is no award or modification history to display for this agreement yet.
                </p>
            ) : (
                <>
                    <p className="font-sans-sm margin-bottom-4">
                        This is a list of Award and Modification history for this agreement. Expand each section to view
                        details.
                    </p>
                    {awardHistory.map((record, index) => (
                        <Accordion
                            key={`${record.fiscal_year_label}-${index}`}
                            heading={record.fiscal_year_label}
                            level={3}
                            isClosed={true}
                            dataCy={`award-mod-accordion-${index}`}
                        >
                            <div
                                className="display-flex"
                                // The accordion content wrapper adds 16px top padding; +4px here
                                // makes the total gap to the first group title 20px.
                                style={{ gap: "3rem", marginTop: "4px" }}
                            >
                                {getAwardModificationSections(record).map((column, columnIndex) => (
                                    <div
                                        key={columnIndex}
                                        className="flex-fill display-flex flex-column"
                                        style={{ gap: "2rem" }}
                                    >
                                        {column.map((group) => (
                                            <div
                                                key={group.dataCy}
                                                data-cy={group.dataCy}
                                            >
                                                <h4 className="margin-0 margin-bottom-neg-1 font-sans-3xs text-bold text-base-dark">
                                                    {group.title}
                                                </h4>
                                                <dl
                                                    className="display-flex flex-wrap margin-0"
                                                    style={{ gap: "0.75rem 2rem" }}
                                                >
                                                    {group.fields.map((field) => (
                                                        <TermTag
                                                            key={field.dataCy}
                                                            term={field.label}
                                                            description={field.value}
                                                        />
                                                    ))}
                                                </dl>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            {record.edits?.length > 0 && (
                                <div
                                    data-cy="award-mod-edits"
                                    data-testid="award-mod-edits"
                                    className="display-flex flex-column margin-top-4"
                                    style={{ gap: "1.5rem" }}
                                >
                                    <h4 className="margin-0 margin-bottom-neg-1 font-sans-3xs text-bold text-base-dark">
                                        Contract Modification Edits
                                    </h4>
                                    {record.edits.map((edit) => (
                                        <AwardModificationEdit
                                            key={edit.id}
                                            edit={edit}
                                        />
                                    ))}
                                </div>
                            )}
                        </Accordion>
                    ))}
                </>
            )}
        </>
    );
};

export default AgreementAwardModifications;
