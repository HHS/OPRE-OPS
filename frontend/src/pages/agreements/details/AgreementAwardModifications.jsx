import { useGetAgreementAwardHistoryByIdQuery } from "../../../api/opsAPI";
import Accordion from "../../../components/UI/Accordion/Accordion";
import Tag from "../../../components/UI/Tag/Tag";
import { getAwardModificationSections } from "../../../helpers/awardModificationHistory.helpers";

/**
 * @typedef {Object} AgreementAwardModificationsProps
 * @property {import("../../../types/AgreementTypes").Agreement | undefined} agreement - The agreement (needs at least an id).
 */

/**
 * Award & Modification History tab for Contract and AA agreements. Renders one
 * accordion per completed procurement action (initial award + each completed
 * modification), each showing a fixed grid of award/mod fields.
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

    const heading = (
        <>
            <h2 className="font-sans-lg">Award &amp; Modification History</h2>
            <p className="font-sans-sm margin-bottom-4">
                This is a list of Award and Modification history for this agreement. Expand each section to view
                details.
            </p>
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
                    className="font-sans-sm"
                    data-cy="award-mod-empty-state"
                >
                    There is no award or modification history to display for this agreement yet.
                </p>
            ) : (
                awardHistory.map((record, index) => (
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
                                            <h4 className="margin-0 margin-bottom-1 font-sans-3xs text-bold text-base-dark">
                                                {group.title}
                                            </h4>
                                            <div
                                                className="display-flex flex-wrap"
                                                style={{ gap: "0.75rem 2rem" }}
                                            >
                                                {group.fields.map((field) => (
                                                    <dl
                                                        key={field.dataCy}
                                                        className="margin-0 font-12px"
                                                    >
                                                        <dt className="margin-0 text-base-dark">{field.label}</dt>
                                                        <dd className="margin-0 margin-top-1">
                                                            <Tag
                                                                dataCy={`${field.dataCy}-tag`}
                                                                tagStyle="primaryDarkTextLightBackground"
                                                                text={field.value}
                                                            />
                                                        </dd>
                                                    </dl>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </Accordion>
                ))
            )}
        </>
    );
};

export default AgreementAwardModifications;
