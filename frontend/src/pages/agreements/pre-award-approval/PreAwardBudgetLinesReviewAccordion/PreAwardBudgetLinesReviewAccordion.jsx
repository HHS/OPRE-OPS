import AgreementBLIAccordion from "../../../../components/Agreements/AgreementBLIAccordion";
import AgreementBLIReviewTable from "../../../../components/BudgetLineItems/BLIReviewTable";
import ServicesComponentAccordion from "../../../../components/ServicesComponents/ServicesComponentAccordion";
import GrantNumberAccordion from "../../../../components/GrantNumbers/GrantNumberAccordion";
import ReviewExecutingTotalAccordion from "../../../../components/BudgetLineItems/ReviewExecutingTotalAccordion/ReviewExecutingTotalAccordion";
import {
    findDescription,
    findIfOptional,
    findPeriodEnd,
    findPeriodStart
} from "../../../../helpers/servicesComponent.helpers";
import { VALIDATABLE_BLI_STATUSES } from "../constants";

/**
 * @typedef {Object} BudgetLinesReviewAccordionProps
 * @property {any[]} budgetLineItems - Budget line items to review
 * @property {any} agreement - The agreement object
 * @property {any[]} servicesComponents - Services components for the agreement
 * @property {any[]} groupedBudgetLines - Budget lines grouped by services component
 * @property {number} executingTotal - Total of executing budget lines
 * @property {boolean} [showCLINColumn] - Whether to show CLIN number column in the BLI table
 * @property {string} [executingTotalInstructions] - Override instructions for the Review Executing Total section
 * @property {boolean} [showBudgetLineErrors] - When true, inline error styling is applied to
 *   PLANNED/IN_EXECUTION BLI cells. Omit (default false) for read-only review pages where
 *   errors should not be highlighted.
 */

/**
 * Shared component for displaying budget lines review section in pre-award approval pages.
 * Used by RequestPreAwardApproval (pass showBudgetLineErrors={true}),
 * ApprovePreAwardApproval, and ReviewBudgetTeamRequisition pages.
 *
 * @component
 * @param {BudgetLinesReviewAccordionProps} props
 * @returns {React.ReactElement}
 */
export const BudgetLinesReviewAccordion = ({
    budgetLineItems,
    agreement,
    servicesComponents,
    groupedBudgetLines,
    executingTotal,
    showCLINColumn = false,
    executingTotalInstructions = undefined,
    showBudgetLineErrors = false
}) => {
    const isGrant = agreement?.agreement_type === "GRANT";
    return (
        <>
            {/* Budget Lines Review */}
            <AgreementBLIAccordion
                title="Review Budget Lines"
                instructions="Please review the Services Components and Budget Lines below to ensure everything is up to date."
                budgetLineItems={budgetLineItems}
                agreement={agreement}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
            >
                {groupedBudgetLines &&
                    groupedBudgetLines.length > 0 &&
                    groupedBudgetLines
                        .filter(
                            (group) =>
                                // Hide the "not associated" bucket (SC or grant number) when empty
                                (isGrant
                                    ? String(group.grantNumberNumber) !== "0"
                                    : group.serviceComponentGroupingLabel !== "0") || group.budgetLines.length > 0
                        )
                        .map((/** @type {any} */ group, /** @type {number} */ index) => {
                            if (isGrant) {
                                return (
                                    <GrantNumberAccordion
                                        key={`${group.grantNumberNumber}-${index}`}
                                        grantNumberNumber={group.grantNumberNumber}
                                    >
                                        {group.budgetLines.length > 0 ? (
                                            <AgreementBLIReviewTable
                                                readOnly={true}
                                                budgetLines={group.budgetLines}
                                                isReviewMode={true}
                                                servicesComponentNumber={group.grantNumberNumber}
                                                action=""
                                                showCLINColumn={showCLINColumn}
                                                errorStatuses={
                                                    showBudgetLineErrors ? VALIDATABLE_BLI_STATUSES : undefined
                                                }
                                            />
                                        ) : (
                                            <p className="text-center margin-y-7">
                                                No budget lines in this grant number.
                                            </p>
                                        )}
                                    </GrantNumberAccordion>
                                );
                            }
                            const budgetLineScGroupingLabel = group.serviceComponentGroupingLabel
                                ? group.serviceComponentGroupingLabel
                                : group.servicesComponentNumber;
                            return (
                                <ServicesComponentAccordion
                                    key={`${group.servicesComponentNumber}-${index}`}
                                    servicesComponentNumber={group.servicesComponentNumber}
                                    serviceComponentGroupingLabel={group.serviceComponentGroupingLabel}
                                    withMetadata={true}
                                    periodStart={findPeriodStart(servicesComponents, budgetLineScGroupingLabel)}
                                    periodEnd={findPeriodEnd(servicesComponents, budgetLineScGroupingLabel)}
                                    description={findDescription(servicesComponents, budgetLineScGroupingLabel)}
                                    optional={findIfOptional(servicesComponents, budgetLineScGroupingLabel)}
                                    serviceRequirementType={agreement?.service_requirement_type}
                                >
                                    {group.budgetLines.length > 0 ? (
                                        <AgreementBLIReviewTable
                                            readOnly={true}
                                            budgetLines={group.budgetLines}
                                            isReviewMode={true}
                                            servicesComponentNumber={group.servicesComponentNumber}
                                            action=""
                                            showCLINColumn={showCLINColumn}
                                            errorStatuses={showBudgetLineErrors ? VALIDATABLE_BLI_STATUSES : undefined}
                                        />
                                    ) : (
                                        <p className="text-center margin-y-7">
                                            No budget lines in this services component.
                                        </p>
                                    )}
                                </ServicesComponentAccordion>
                            );
                        })}
            </AgreementBLIAccordion>

            {/* Review Executing Total */}
            <ReviewExecutingTotalAccordion
                executingTotal={executingTotal}
                {...(executingTotalInstructions !== undefined && { instructions: executingTotalInstructions })}
            />
        </>
    );
};
