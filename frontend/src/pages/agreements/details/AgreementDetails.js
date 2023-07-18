import AgreementTotalBudgetLinesCard from "../../../components/Agreements/AgreementDetailsCards/AgreementTotalBudgetLinesCard";
import AgreementValuesCard from "../../../components/Agreements/AgreementDetailsCards/AgreementValuesCard";
import {Link} from "react-router-dom";
import Terms from "../review/Terms";
import {convertCodeForDisplay} from "../../../helpers/utils";
import Tag from "../../../components/UI/Tag/Tag";

const AgreementDetails =  ({ agreement }) => {

    let {budget_line_items: _, ...agreement_details} = agreement;

    // details for AgreementTotalBudgetLinesCard
    const blis = agreement.budget_line_items ? agreement.budget_line_items : []
    const numberOfAgreements = blis.length;
    const countsByStatus = blis.reduce((p, c) => {
        const status = c.status;
        if (!p.hasOwnProperty(status)) {
            p[status] = 0;
        }
        p[status]++;
        return p;
    }, {});

    return (
        <div>
            <h2 className="font-sans-lg">Agreement Summary
             <Link to={"/agreements/edit/" + agreement.id + "?mode=edit"}>
                <span style={{float:"right"}}>Edit</span>
             </Link>
            </h2>
            <p className="font-sans-sm">
                The summary below shows the budget lines and spending for this agreement.
            </p>
            <div className="display-flex flex-justify">
                <AgreementTotalBudgetLinesCard
                    numberOfAgreements={numberOfAgreements}
                    countsByStatus={countsByStatus}
                />
                <AgreementValuesCard/>
            </div>
            <section>
                <h2 className="font-sans-lg">Agreement Details</h2>

                <div className="grid-row margin-top-2">
                    <div className="grid-col-6">
                        <dl className="margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">Description</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                {agreement.description}
                            </dd>
                            <dt className="margin-0 text-base-dark margin-top-3">Notes</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                TODO
                            </dd>
                            <dt className="margin-0 text-base-dark margin-top-3">History</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                TODO
                            </dd>
                        </dl>
                    </div>
                    <div className="grid-col-6">
                        <dl className="margin-0 font-12px">
                            <dt className="margin-0 text-base-dark margin-top-3">Agreement Type</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                <Tag tagStyle="darkTextLightBackground" text={convertCodeForDisplay("agreementType", agreement.agreement_type)}/>

                            </dd>
                            <dt className="margin-0 text-base-dark margin-top-3">Product Service Code</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                <Tag tagStyle="darkTextLightBackground" text={agreement.product_service_code?.name}/>
                            </dd>
                            <dt className="margin-0 text-base-dark margin-top-3">NAICS Code</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                <Tag tagStyle="darkTextLightBackground" text={agreement.product_service_code?.naics}/>
                            </dd>
                            <dt className="margin-0 text-base-dark margin-top-3">Program Support Code</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                <Tag tagStyle="darkTextLightBackground" text={agreement?.product_service_code?.support_code}/>
                            </dd>

                            <dt className="margin-0 text-base-dark margin-top-3">Procurement Shop</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                <Tag tagStyle="darkTextLightBackground" text={`${agreement?.procurement_shop?.abbr} - Fee Rate: ${
                                    agreement?.procurement_shop?.fee * 100
                                }%`}/>
                            </dd>
                            <dt className="margin-0 text-base-dark margin-top-3">Agreement Reason</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                <Tag tagStyle="darkTextLightBackground" text={convertCodeForDisplay("agreementReason", agreement?.agreement_reason)}/>
                            </dd>
                            <dt className="margin-0 text-base-dark margin-top-3">Incumbent</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                <Tag tagStyle="darkTextLightBackground" text={agreement?.incumbent}/>
                            </dd>
                            <dt className="margin-0 text-base-dark margin-top-3">Project Officer</dt>
                            <dd className="text-semibold margin-0 margin-top-05">
                                <Tag tagStyle="darkTextLightBackground" text="TODO"/>
                            </dd>
                        </dl>

                    </div>
                </div>
            </section>
            <pre>
            {JSON.stringify(countsByStatus, null, 2)}
            </pre>
            <pre>
            {JSON.stringify(agreement_details, null, 2)}
            </pre>
        </div>
    );
};

export default AgreementDetails;
