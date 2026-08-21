import AgreementDetailHeader from "../../../components/Agreements/AgreementDetailHeader";
import { useGetGrantNumbersListQuery } from "../../../api/opsAPI";
import { useIsUserSuperUser } from "../../../hooks/user.hooks";
import { AgreementType } from "../agreements.constants";
import AgreementDetailsEdit from "./AgreementDetailsEdit";
import AgreementDetailsView from "./AgreementDetailsView";

/**
 * Renders the details of an agreement, including budget lines, spending, and other information.
 * @param {object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement - The agreement object to display details for.
 * @param {function} props.setHasAgreementChanged - The function to set the agreement changed state.
 * @param {import("../../../types/UserTypes").SafeUser} props.projectOfficer - The project officer object for the agreement.
 * @param {import("../../../types/UserTypes").SafeUser} props.alternateProjectOfficer - The alternate project officer object for the agreement.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {boolean} props.isAgreementNotDeveloped - Whether the agreement is not yet developed.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @param {boolean} [props.isAgreementAwarded] - if the agreement is awarded
 * @param {boolean} [props.hasAgreementChanged] - if the agreement properties has changed
 * @param {boolean} [props.isPreAwardInReview] - if the agreement is in review for pre-award approval
 * @param {boolean} [props.isAwardInReview] - if the agreement is in review for award approval
 * @param {boolean} [props.isPostPreAwardLocked] - if the agreement is permanently locked after full pre-award approval
 * @returns {React.ReactElement} - The rendered component.
 */
const AgreementDetails = ({
    agreement,
    setHasAgreementChanged,
    projectOfficer,
    alternateProjectOfficer,
    isEditMode,
    setIsEditMode,
    isAgreementNotDeveloped,
    isAgreementAwarded = false,
    hasAgreementChanged = false,
    isPreAwardInReview = false,
    isAwardInReview = false,
    isPostPreAwardLocked = false
}) => {
    const isSuperUser = useIsUserSuperUser();
    const isGrant = agreement?.agreement_type === AgreementType.GRANT;
    const { data: grantNumbers } = useGetGrantNumbersListQuery(agreement?.id, {
        skip: !isGrant || !agreement?.id
    });

    const nofoPeriodStart =
        grantNumbers && grantNumbers.length > 0
            ? grantNumbers.reduce((min, gn) => {
                  if (!gn.period_start) return min;
                  return !min || gn.period_start < min ? gn.period_start : min;
              }, null)
            : null;

    const nofoPeriodEnd =
        grantNumbers && grantNumbers.length > 0
            ? grantNumbers.reduce((max, gn) => {
                  if (!gn.period_end) return max;
                  return !max || gn.period_end > max ? gn.period_end : max;
              }, null)
            : null;

    // eslint-disable-next-line no-unused-vars
    let { budget_line_items: _, ...agreement_details } = agreement;
    // Intentionally blocks the Details edit form during all procurement locks (pre-award review,
    // award review, and post-pre-award lock), not just post-pre-award. This is broader than the
    // OPS-2280 PR scope but correct: if the header already shows editing as disabled for those
    // states, the form should not be reachable via URL params either.
    const isEditable =
        !isPreAwardInReview &&
        !isAwardInReview &&
        !isPostPreAwardLocked &&
        (isSuperUser || (agreement?._meta.isEditable && !isAgreementNotDeveloped));

    return (
        <article>
            <AgreementDetailHeader
                heading={isEditMode ? "Edit Agreement Details" : "Agreement Details"}
                details=""
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isEditable={isEditable}
                hasUnsavedChanges={hasAgreementChanged}
                isPreAwardInReview={isPreAwardInReview}
                isAwardInReview={isAwardInReview}
                isPostPreAwardLocked={isPostPreAwardLocked}
            />

            {isEditMode && isEditable ? (
                <AgreementDetailsEdit
                    agreement={agreement}
                    setHasAgreementChanged={setHasAgreementChanged}
                    projectOfficer={projectOfficer}
                    alternateProjectOfficer={alternateProjectOfficer}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                />
            ) : (
                <AgreementDetailsView
                    agreement={agreement}
                    projectOfficer={projectOfficer}
                    alternateProjectOfficer={alternateProjectOfficer}
                    isAgreementAwarded={isAgreementAwarded}
                    nofoPeriodStart={nofoPeriodStart}
                    nofoPeriodEnd={nofoPeriodEnd}
                />
            )}
        </article>
    );
};

export default AgreementDetails;
