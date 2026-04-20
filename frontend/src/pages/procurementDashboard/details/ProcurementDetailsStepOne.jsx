import Tag from "../../../components/UI/Tag";
import { ProcurementDetailsTable } from "./ProcurementDetailsTable";

const ProcurementDetailsStepOne = ({agreements}) => {
    return (
        <>
            <div>
                <p className="line-height-alt-4 margin-bottom-5">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa earum odit debitis eveniet laboriosam
                    cumque, id rem similique. Amet harum doloribus distinctio unde eum cumque deserunt eius alias
                    corrupti fugit!
                </p>
            </div>
            <div
                className="display-flex"
                style={{ gap: "5rem" }}
            >
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Agreements</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                // dataCy="agreement-nickname-tag"
                                tagStyle="primaryDarkTextLightBackground"
                                text={"$5000"}
                            />
                        </dd>
                    </dl>
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Executing Budget Lines</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                // dataCy="agreement-nickname-tag"
                                tagStyle="primaryDarkTextLightBackground"
                                text={"$5000"}
                            />
                        </dd>
                    </dl>
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Total Executing</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                // dataCy="agreement-nickname-tag"
                                tagStyle="primaryDarkTextLightBackground"
                                text={"$5000"}
                            />
                        </dd>
                    </dl>
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Total Fees</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                // dataCy="agreement-nickname-tag"
                                tagStyle="primaryDarkTextLightBackground"
                                text={"$5000"}
                            />
                        </dd>
                    </dl>
            </div>
            <ProcurementDetailsTable
            agreements={agreements}>

            </ProcurementDetailsTable>
        </>
    );
};

export default ProcurementDetailsStepOne;
