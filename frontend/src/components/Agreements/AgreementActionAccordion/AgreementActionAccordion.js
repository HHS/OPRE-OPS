import React from "react";
import RadioButtonTile from "../../UI/RadioButtonTile";

const AgreementActionAccordion = () => {
    const [value, setValue] = React.useState("Change Draft Budget Lines to Planned Status");
    return (
        <fieldset className="usa-fieldset">
            <legend className="usa-legend">
                Choose which action you’d like to initiate and then select the budget lines below.
            </legend>
            <RadioButtonTile
                label="Change Draft Budget Lines to Planned Status"
                description="This will subtract the amounts from the FY budget"
                checked={true}
                setValue={setValue}
            />
            <RadioButtonTile
                label="Change Planned Budget Lines to Executing Status"
                description="This will start the procurement process"
                setValue={setValue}
            />

            <p>{value} is Selected</p>
        </fieldset>
    );
};

export default AgreementActionAccordion;
