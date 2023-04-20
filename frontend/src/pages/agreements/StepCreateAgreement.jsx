import { useSelector, useDispatch } from "react-redux";
import { StepIndicator } from "../../components/UI/StepIndicator/StepIndicator";
import { ProcurementShopSelect } from "./ProcurementShopSelect";
import { AgreementReasonSelect } from "./AgreementReasonSelect";
import { AgreementTypeSelect } from "./AgreementTypeSelect";
import { ProductServiceCodeSelect } from "./ProductServiceCodeSelect";
import {
    setProcurementShopsList,
    setSelectedProcurementShop,
    setAgreementTitle,
    setAgreementDescription,
    setAgreementProductServiceCode,
    setAgreementIncumbent,
    setAgreementProjectOfficer,
    setAgreementTeamMembers,
    setAgreementNotes,
} from "./createAgreementSlice";
import { ProjectOfficerSelect } from "./ProjectOfficerSelect";

export const StepCreateAgreement = ({ goBack, goToNext, wizardSteps }) => {
    const dispatch = useDispatch();
    const agreementTitle = useSelector((state) => state.createAgreement.agreement.name);
    const agreementDescription = useSelector((state) => state.createAgreement.agreement.description);
    const agreementNotes = useSelector((state) => state.createAgreement.agreement.notes);

    const handleContinue = () => {
        goToNext();
    };

    return (
        <>
            <h1 className="font-sans-lg">Create New Budget Line</h1>
            <p>Step Two: Creating a new Agreement</p>
            <StepIndicator steps={wizardSteps} currentStep={2} />
            <h2 className="font-sans-md">Select the Agreement Type</h2>
            <p>Select the type of agreement you would like to create.</p>
            <AgreementTypeSelect />

            <h2 className="font-sans-md">Agreement Details</h2>
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

            <h2 className="font-sans-md">Procurement Shop</h2>
            <p>
                Select the Procurement Shop, and the fee rates will be populated in the table below. If this is an
                active agreement, it will default to the procurement shop currently being used.
            </p>
            <ProcurementShopSelect />

            <h2 className="font-sans-md">Reason for Agreement</h2>
            <AgreementReasonSelect />
            {/* <IncumbentSelect /> */}
            <select />
            <select />

            <h2 className="font-sans-md">Points of Contact</h2>
            <ProjectOfficerSelect />
            {/* <TeamMembersSelect /> */}

            <div>
                <label>Team Members Added</label>
                {/* <TeamMembersPreview /> */}
                <ul>
                    <li>Person 1</li>
                    <li>Person 2</li>
                </ul>
            </div>
            <h2 className="font-sans-md">Notes</h2>
            <input
                className="usa-input"
                id="agreement-notes"
                name="agreement-notes"
                type="text"
                value={agreementNotes || ""}
                onChange={(e) => dispatch(setAgreementNotes(e.target.vaue))}
            />
            <div className="grid-row flex-justify-end margin-top-8">
                <button className="usa-button" onClick={handleContinue}>
                    Continue
                </button>
            </div>
        </>
    );
};
