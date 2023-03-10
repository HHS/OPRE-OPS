import React from "react";

import App from "../../App";
import { StepIndicator } from "../../components/UI/StepIndicator/StepIndicator";
import { CreateBudgetLineFlow } from "./CreateBudgetLineFlow";
import { ProjectSelect } from "./ProjectSelect";

const StepOne = ({ goBack, goToNext }) => (
    <>
        <section className="usa-banner" aria-label="Official website of the United States government">
            <div className="usa-accordion">
                <header className="usa-banner__header">
                    <div className="usa-banner__inner">
                        <div className="grid-col-auto">
                            <img
                                aria-hidden="true"
                                className="usa-banner__header-flag"
                                src="/assets/img/us_flag_small.png"
                                alt=""
                            />
                        </div>
                        <div className="grid-col-fill tablet:grid-col-auto" aria-hidden="true">
                            <p className="usa-banner__header-text">
                                An official website of the United States government
                            </p>
                            <p className="usa-banner__header-action">Here’s how you know</p>
                        </div>
                        <button
                            type="button"
                            className="usa-accordion__button usa-banner__button"
                            aria-expanded="false"
                            aria-controls="gov-banner-default-default"
                        >
                            <span className="usa-banner__button-text">Here’s how you know</span>
                        </button>
                    </div>
                </header>
                <div className="usa-banner__content usa-accordion__content" id="gov-banner-default-default">
                    <div className="grid-row grid-gap-lg">
                        <div className="usa-banner__guidance tablet:grid-col-6">
                            <img
                                className="usa-banner__icon usa-media-block__img"
                                src="/assets/img/icon-dot-gov.svg"
                                role="img"
                                alt=""
                                aria-hidden="true"
                            />
                            <div className="usa-media-block__body">
                                <p>
                                    <strong>Official websites use .gov</strong>
                                    <br />A<strong>.gov</strong> website belongs to an official government organization
                                    in the United States.
                                </p>
                            </div>
                        </div>
                        <div className="usa-banner__guidance tablet:grid-col-6">
                            <img
                                className="usa-banner__icon usa-media-block__img"
                                src="/assets/img/icon-https.svg"
                                role="img"
                                alt=""
                                aria-hidden="true"
                            />
                            <div className="usa-media-block__body">
                                <p>
                                    <strong>Secure .gov websites use HTTPS</strong>
                                    <br />A<strong>lock</strong> (
                                    <span className="icon-lock">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="52"
                                            height="64"
                                            viewBox="0 0 52 64"
                                            className="usa-banner__lock-image"
                                            role="img"
                                            aria-labelledby="banner-lock-description-default"
                                            focusable="false"
                                        >
                                            <title id="banner-lock-title-default">Lock</title>
                                            <desc id="banner-lock-description-default">Locked padlock icon</desc>
                                            <path
                                                fill="#000000"
                                                fillRule="evenodd"
                                                d="M26 0c10.493 0 19 8.507 19 19v9h3a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4h3v-9C7 8.507 15.507 0 26 0zm0 8c-5.979 0-10.843 4.77-10.996 10.712L15 19v9h22v-9c0-6.075-4.925-11-11-11z"
                                            />
                                        </svg>{" "}
                                    </span>
                                    ) or <strong>https://</strong> means you’ve safely connected to the .gov website.
                                    Share sensitive information only on official, secure websites.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step One</p>
        <StepIndicator />
        <h2 className="font-sans-lg">Select a Project or Create a New One</h2>
        <p>
            Select the project this budget line should be associated with. If you need to create a new project, click
            Add New Project.
        </p>
        <ProjectSelect />
        <div className="grid-row">
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
