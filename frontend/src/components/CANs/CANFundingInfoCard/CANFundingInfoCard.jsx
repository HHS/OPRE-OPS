import { NO_DATA } from "../../../constants";
import Card from "../../UI/Cards/Card";
import TermTag from "../../UI/Term/TermTag";
import { formatObligateBy } from "../CANTable/CANTable.helpers";
/**
 *  @typedef {import("../../../types/CANTypes").FundingDetails} FundingDetails
 */

/**
 * @typedef {Object} CANFundingInfoCard
 * @property {FundingDetails} [funding]
 * @property {number} fiscalYear
 */

/**
 * @component - The CAN Funding component.
 * @param {CANFundingInfoCard} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANFundingInfoCard = ({ funding, fiscalYear }) => {
    if (!funding) {
        return <div>No funding information available for this CAN.</div>;
    }

    return (
        <Card
            className="width-full"
            dataCy="can-funding-info-card"
        >
            <h3
                className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal"
                style={{ whiteSpace: "pre-line", lineHeight: "20px" }}
            >
                {`FY ${fiscalYear} CAN Funding Information`}
            </h3>
            <div className="grid-row grid-gap">
                <div className="grid-col">
                    <dl>
                        <TermTag
                            term="Appropriation FY"
                            description={funding.fiscal_year.toString()}
                        />
                        <TermTag
                            term="Fund Code"
                            description={funding.fund_code}
                        />
                    </dl>
                </div>
                <div className="grid-col">
                    <dl>
                        <TermTag
                            term="Active Period"
                            description={
                                (funding.active_period ?? 0) > 1
                                    ? `${funding.active_period} Years`
                                    : `${funding.active_period} Year`
                            }
                        />

                        <TermTag
                            term="Allowance"
                            description={funding.allowance ?? NO_DATA}
                        />
                    </dl>
                </div>
                <div className="grid-col">
                    <dl>
                        <TermTag
                            term="Obligate By"
                            description={formatObligateBy(funding.obligate_by) ?? NO_DATA}
                        />
                        <TermTag
                            term="Allotment"
                            description={funding.allotment ?? NO_DATA}
                        />
                    </dl>
                </div>
                <div className="grid-col">
                    <dl>
                        <TermTag
                            term="Funding Received"
                            description={funding.funding_received ?? NO_DATA}
                        />
                        <TermTag
                            term="Funding Source"
                            description={funding.funding_source ?? NO_DATA}
                        />
                    </dl>
                </div>
                <div className="grid-col">
                    <dl>
                        <TermTag
                            term="Funding Method"
                            description={funding.funding_method ?? NO_DATA}
                        />
                        <TermTag
                            term="Partner"
                            description={funding.funding_partner ?? NO_DATA}
                        />
                    </dl>
                </div>
                <div className="grid-col">
                    <dl>
                        <TermTag
                            term="Funding Type"
                            description={funding.funding_type ?? NO_DATA}
                        />
                        <TermTag
                            term="Method of Transfer"
                            description={funding.method_of_transfer ?? NO_DATA}
                        />
                    </dl>
                </div>
            </div>
        </Card>
    );
};

export default CANFundingInfoCard;
