import { useNavigate } from "react-router-dom";
import { buildTrailState, LIST_CRUMBS } from "../../../helpers/breadcrumb.helpers";
import { useAncestryForChildren } from "../../../hooks/useBreadcrumbTrail.hooks";

/**
 * Shared hook for a procurement tracker step's "Request … Approval" button.
 *
 * The approval page's trail ends with this agreement's procurement tracker, so
 * its breadcrumb reads "… > <agreement> > <approval page>" and links back here.
 *
 * @param {Object} params
 * @param {number} params.agreementId - The agreement the approval is requested for.
 * @param {string} [params.agreementName] - The agreement's name, used as its crumb label.
 * @param {string} params.approvalRoute - The approval page's sub-route (e.g. "pre-award-approval").
 * @returns {() => void} Navigates to the approval page with the breadcrumb trail attached.
 */
export default function useNavigateToApproval({ agreementId, agreementName, approvalRoute }) {
    const navigate = useNavigate();
    const approvalPath = `/agreements/${agreementId}/${approvalRoute}`;
    const approvalAncestry = useAncestryForChildren({
        ownCrumb: { label: agreementName ?? "Agreement", to: `/agreements/${agreementId}/procurement-tracker` },
        fallbackCrumb: LIST_CRUMBS.agreements
    });
    return () => navigate(approvalPath, { state: buildTrailState(approvalPath, approvalAncestry) });
}
