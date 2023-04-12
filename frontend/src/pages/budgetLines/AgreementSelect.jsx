import { useDispatch, useSelector } from "react-redux";
import { setSelectedAgreement, setBudgetLineAdded, setSelectedProcurementShop } from "./createBudgetLineSlice";

export const AgreementSelect = () => {
    const dispatch = useDispatch();
    const agreements = useSelector((state) => state.createBudgetLine.agreements);
    const selectedAgreement = useSelector((state) => state.createBudgetLine.selected_agreement);
    const onChangeAgreementSelection = (agreementId = 0) => {
        const selectedAgreement = agreements.find((agreement) => agreement.id === agreementId);
        if (agreementId === 0) {
            return;
        }
        dispatch(
            setSelectedAgreement({
                ...selectedAgreement,
                projectOfficer: selectedAgreement?.project_officer,
                periodOfPerformance: `${selectedAgreement?.period_of_performance_start} - ${selectedAgreement?.period_of_performance_end}`,
            })
        );
        // set budget line items and procurement shop
        if (selectedAgreement?.budget_line_items.length > 0) {
            dispatch(setBudgetLineAdded(selectedAgreement?.budget_line_items));
            dispatch(setSelectedProcurementShop(selectedAgreement?.procurement_shop));
        }
    };

    const AgreementSummaryCard = () => {
        return (
            <div
                className="bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-sm margin-top-4"
                style={{ width: "23.9375rem", minHeight: "11.75rem" }}
            >
                <dl className="margin-0 padding-y-2 padding-x-105">
                    <dt className="margin-0 text-base-dark">Agreement</dt>
                    <dd className="text-semibold margin-0">{selectedAgreement.name}</dd>
                    <dt className="margin-0 text-base-dark margin-top-205">Description</dt>
                    <dd className="text-semibold margin-0">{selectedAgreement.description}</dd>
                    <div className="display-flex flex-justify margin-top-205">
                        <div className="display-flex flex-column">
                            <dt className="margin-0 text-base-dark">Project Officer</dt>
                            <dd className="text-semibold margin-0">{selectedAgreement.projectOfficer}</dd>
                        </div>
                        <div className="display-flex flex-column">
                            <dt className="margin-0 text-base-dark">Period of Performance</dt>
                            <dd className="text-semibold margin-0">{selectedAgreement.periodOfPerformance}</dd>
                        </div>
                    </div>
                </dl>
            </div>
        );
    };
    return (
        <div className="display-flex flex-justify padding-top-105">
            <div className="left-half width-full">
                {/* NOTE: Left side */}
                <label className="usa-label" htmlFor="agreement" id="agreement-label">
                    Agreements
                </label>
                <div>
                    <select
                        className="usa-select margin-top-0 width-full"
                        name="options"
                        id="options"
                        onChange={(e) => onChangeAgreementSelection(Number(e.target.value) || 0)}
                        value={selectedAgreement?.id}
                        required
                    >
                        <option value={0}>- Select -</option>
                        {agreements.map((shop) => (
                            <option key={shop?.id} value={shop?.id}>
                                {shop?.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {/* NOTE: Right side */}
            <div className="right-half">{selectedAgreement?.id && <AgreementSummaryCard />}</div>
        </div>
    );
};
