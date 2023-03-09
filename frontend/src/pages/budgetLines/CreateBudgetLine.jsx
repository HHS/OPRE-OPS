import React from "react";

import App from "../../App";
import { StepIndicator } from "../../components/UI/StepIndicator/StepIndicator";
import { CreateBudgetLineFlow } from "./CreateBudgetLineFlow";

const StepOne = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step One</p>
        <StepIndicator />
        <div className="float-right">
            <button className="usa-button usa-button--outline" onClick={() => goBack()}>
                Back
            </button>
            <button className="usa-button" onClick={() => goToNext({ name: "John Doe" })}>
                Continue
            </button>
        </div>
    </>
);
const StepTwo = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step Two</p>
        <StepIndicator />
        <div className="float-right">
            <button className="usa-button usa-button--outline" onClick={() => goBack()}>
                Back
            </button>
            <button className="usa-button" onClick={() => goToNext({ age: 100 })}>
                Continue
            </button>
        </div>
    </>
);
const StepThree = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step Three</p>
        <StepIndicator />
        <div className="float-right">
            <button className="usa-button usa-button--outline" onClick={() => goBack()}>
                Back
            </button>
            <button className="usa-button" onClick={() => goToNext({ hairColor: "brown" })}>
                Continue
            </button>
        </div>
    </>
);

export const CreateBudgetLine = () => {
    return (
        <App>
            <CreateBudgetLineFlow
                onFinish={(data) => {
                    console.log("budget line has: " + JSON.stringify(data, null, 2));
                    alert("Budget Line Created!");
                }}
            >
                <StepOne />
                <StepTwo />
                <StepThree />
            </CreateBudgetLineFlow>
        </App>
    );
};
