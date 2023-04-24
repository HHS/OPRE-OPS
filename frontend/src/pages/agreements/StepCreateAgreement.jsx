import { useSelector, useDispatch } from "react-redux";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import ProcurementShopSelect from "./ProcurementShopSelect";
import AgreementReasonSelect from "./AgreementReasonSelect";
import AgreementTypeSelect from "./AgreementTypeSelect";
import ProductServiceCodeSelect from "./ProductServiceCodeSelect";
import { setAgreementTitle, setAgreementDescription, setAgreementNotes } from "./createAgreementSlice";
import ProjectOfficerSelect from "./ProjectOfficerSelect";
import TeamMemberSelect from "./TeamMemberSelect";
import TeamMemberList from "./TeamMemberList";
import { postAgreement } from "../../api/postAgreements";

export const StepCreateAgreement = ({ goBack, goToNext, wizardSteps }) => {
    const dispatch = useDispatch();
    const agreementTitle = useSelector((state) => state.createAgreement.agreement.name);
    const agreementDescription = useSelector((state) => state.createAgreement.agreement.description);
    const agreementNotes = useSelector((state) => state.createAgreement.agreement.notes);
    const agreement = useSelector((state) => state.createAgreement.agreement);

    const handleContinue = () => {
        // Save Agreement to DB
        const {
            selected_agreement_type,
            selected_agreement_reason,
            selected_product_service_code,
            selected_incumbent,
            ...otherProperties
        } = agreement;
        const newAgreement = {
            ...otherProperties,
            agreement_type: selected_agreement_type,
            agreement_reason: selected_agreement_reason,
            product_service_code: selected_product_service_code,
            incumbent: selected_incumbent,
        };
        const response = postAgreement(newAgreement);
        console.log(response);
        goToNext();
    };

    return (
        <>
            <h1 className="font-sans-lg">Create New Budget Line</h1>
            <p>Step Two: Creating a new Agreement</p>
            <StepIndicator steps={wizardSteps} currentStep={2} />
            <h2 className="font-sans-lg">Select the Agreement Type</h2>
            <p>Select the type of agreement you would like to create.</p>
            <AgreementTypeSelect />

            <h2 className="font-sans-lg">Agreement Details</h2>
            <label className="usa-label" htmlFor="agreement-title">
                Agreement Title
            </label>
            <input
                className="usa-input"
                id="agreement-title"
                name="agreement-title"
                type="text"
                value={agreementTitle || ""}
                onChange={(e) => dispatch(setAgreementTitle(e.target.value))}
                required
            />

            <label className="usa-label" htmlFor="agreement-description">
                Description
            </label>
            <input
                className="usa-input"
                id="agreement-description"
                name="agreement-description"
                type="text"
                value={agreementDescription || ""}
                onChange={(e) => dispatch(setAgreementDescription(e.target.vaue))}
            />

            <ProductServiceCodeSelect />

            <h2 className="font-sans-lg">Procurement Shop</h2>
            <p>
                Select the Procurement Shop, and the fee rates will be populated in the table below. If this is an
                active agreement, it will default to the procurement shop currently being used.
            </p>
            <ProcurementShopSelect />

            <h2 className="font-sans-lg">Reason for Agreement</h2>
            <AgreementReasonSelect />
            {/* <IncumbentSelect /> */}

            <h2 className="font-sans-lg">Points of Contact</h2>
            <div className="display-flex">
                <ProjectOfficerSelect />
                <TeamMemberSelect className="margin-left-4" />
            </div>

            <h3 className="font-sans-sm text-semibold">Team Members Added</h3>
            <TeamMemberList />

            <h2 className="font-sans-lg">Notes</h2>
            <input
                className="usa-input"
                id="agreement-notes"
                name="agreement-notes"
                type="text"
                value={agreementNotes || ""}
                onChange={(e) => dispatch(setAgreementNotes(e.target.value))}
            />
            <div className="grid-row flex-justify-end margin-top-8">
                <button className="usa-button usa-button--unstyled margin-right-2" onClick={() => goBack()}>
                    Back
                </button>
                <button className="usa-button" onClick={handleContinue}>
                    Continue
                </button>
            </div>
        </>
    );
};
