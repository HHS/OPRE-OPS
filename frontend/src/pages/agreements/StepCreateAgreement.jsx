import { useSelector, useDispatch } from "react-redux";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import ProcurementShopSelect from "./ProcurementShopSelect";
import AgreementReasonSelect from "./AgreementReasonSelect";
import AgreementTypeSelect from "./AgreementTypeSelect";
import ProductServiceCodeSelect from "./ProductServiceCodeSelect";
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
import ProjectOfficerSelect from "./ProjectOfficerSelect";
import TeamMemberSelect from "./TeamMemberSelect";
import TeamMemberList from "./TeamMemberList";

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
            <textarea
                className="usa-textarea"
                id="agreement-description"
                name="agreement-description"
                rows="5"
                style={{ height: "7rem" }}
                value={agreementDescription || ""}
                onChange={(e) => dispatch(setAgreementDescription(e.target.value))}
            ></textarea>

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
            <div className="usa-character-count">
                <div className="usa-form-group">
                    <label className="usa-label font-sans-lg text-bold" htmlFor="with-hint-textarea">
                        Notes (optional)
                    </label>
                    <span id="with-hint-textarea-hint" className="usa-hint">
                        Maximum 150 characters
                    </span>
                    <textarea
                        className="usa-textarea usa-character-count__field"
                        id="with-hint-textarea"
                        maxLength="150"
                        name="with-hint-textarea"
                        rows="5"
                        aria-describedby="with-hint-textarea-info with-hint-textarea-hint"
                        style={{ height: "7rem" }}
                        value={agreementNotes || ""}
                        onChange={(e) => dispatch(setAgreementNotes(e.target.value))}
                    ></textarea>
                </div>
                <span id="with-hint-textarea-info" className="usa-character-count__message sr-only">
                    You can enter up to 150 characters
                </span>
            </div>
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
