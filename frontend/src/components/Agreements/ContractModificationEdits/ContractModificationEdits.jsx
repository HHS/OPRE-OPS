import { useNavigate } from "react-router-dom";
import {
    useGetAgreementContractModificationEditsByIdQuery,
    useGetAgreementContractModificationsByIdQuery
} from "../../../api/opsAPI";
import { useCanEditByRole } from "../../../hooks/user.hooks";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import DisabledButtonWithTooltip from "../../UI/Button/DisabledButtonWithTooltip";
import ContractModificationEditCard from "./ContractModificationEditCard";

/**
 * "Contract Modifications" section of the Award & Modifications tab. Lists the edits made in
 * OPS since the agreement was awarded that still require a contract modification to update the
 * actual contract: approved Modified LOE edits (OPS-3072), and COR changes recorded on save as
 * pending Admin Changes (OPS-3153). Starts the modification (#3268).
 * Edits stay listed, marked In Review, until the Division Director approves the modification.
 * The submitter's Approved/Declined outcome alert lives at the agreement level
 * (`ContractModificationApprovalAlert`, #6546) so it's visible regardless of which tab is active,
 * not just here.
 *
 * @component
 * @param {Object} props
 * @param {number} props.agreementId
 * @param {boolean} [props.isAgreementEditable] - The agreement's `_meta.isEditable` (team membership)
 * @returns {React.ReactElement | null}
 */
const ContractModificationEdits = ({ agreementId, isAgreementEditable = false }) => {
    const navigate = useNavigate();
    const {
        data: edits,
        isLoading,
        isError
    } = useGetAgreementContractModificationEditsByIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });
    const { data: modificationRequests = [] } = useGetAgreementContractModificationsByIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });
    const canEditByRole = useCanEditByRole();

    if (isLoading) {
        return null;
    }

    const inReviewRequest = modificationRequests.find((request) => request.status === "IN_REVIEW");
    const isInReview = Boolean(inReviewRequest);

    let content;
    if (isError) {
        content = <div>Error loading edits that require a contract modification.</div>;
    } else if (edits?.length) {
        content = (
            <ul
                className="usa-list--unstyled display-flex flex-column"
                style={{ gap: "1rem" }}
            >
                {edits.map((edit) => (
                    <li key={edit.id}>
                        <ContractModificationEditCard edit={edit} />
                    </li>
                ))}
            </ul>
        );
    }

    // Only team members with an editing role can start one (the page itself requires it).
    let disabledReason = null;
    if (!isAgreementEditable || !canEditByRole) {
        disabledReason = "Only team members on this agreement can start a Contract Modification";
    } else if (isInReview) {
        disabledReason = "A Contract Modification is already in review for this agreement";
    }

    return (
        <section
            className="margin-bottom-6"
            data-cy="contract-modifications-section"
        >
            {/* The Division Director's Approve/Decline card (ContractModificationRequestReviewCard) is a
                placeholder, so it isn't shown here (#3269); the review UI is #3331. Until then everyone,
                the Division Director included, sees this alert. */}
            {isInReview && (
                <SimpleAlert
                    type="warning"
                    heading="Contract Modification In Review"
                    message="There is a Contract Modification pending approval from the Division Director."
                    headingLevel={2}
                />
            )}
            <h2 className="font-sans-lg">Contract Modifications</h2>
            <p className="font-sans-sm line-height-body-5">
                After an agreement has been awarded, it will require a Contract Modification in order to make changes or
                to execute planned budget lines as-is. If edits have been made in OPS since the agreement was awarded,
                they will be displayed below as a reference. When you are ready to execute a modification, click Start
                Modification below.
            </p>
            {content && (
                <>
                    <h3 className="font-sans-3xs text-normal text-base-dark margin-top-4 margin-bottom-205">
                        Edits That Require a Contract Modification
                    </h3>
                    {content}
                </>
            )}
            <div className="display-flex flex-justify-end margin-top-8">
                {disabledReason ? (
                    // Focusable wrapper so keyboard users can reach the reason (a disabled button can't take focus).
                    <DisabledButtonWithTooltip
                        label={disabledReason}
                        dataCy="start-modification-btn"
                    >
                        Start modification
                    </DisabledButtonWithTooltip>
                ) : (
                    <button
                        type="button"
                        className="usa-button"
                        data-cy="start-modification-btn"
                        onClick={() => navigate(`/agreements/${agreementId}/start-modification`)}
                    >
                        Start modification
                    </button>
                )}
            </div>
        </section>
    );
};

export default ContractModificationEdits;
