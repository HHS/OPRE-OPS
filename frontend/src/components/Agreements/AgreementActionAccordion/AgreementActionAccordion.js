import React from "react";
import RadioButtonTile from "../../UI/RadioButtonTile";
import Accordion from "../../UI/Accordion";

const AgreementActionAccordion = () => {
    const [value, setValue] = React.useState("Change Draft Budget Lines to Planned Status");
    return (
        <Accordion
            heading="Hello"
            level={2}
        >
            <fieldset className="usa-fieldset">
                <legend className="usa-legend maxw-full margin-bottom-2 margin-top-0">
                    Choose which action you’d like to initiate and then select the budget lines below.
                </legend>
                <div className="grid-row grid-gap">
                    <div className="grid-col">
                        <RadioButtonTile
                            label="Change Draft Budget Lines to Planned Status"
                            description="This will subtract the amounts from the FY budget"
                            checked={true}
                            setValue={setValue}
                        />
                    </div>
                    <div className="grid-col">
                        <RadioButtonTile
                            label="Change Planned Budget Lines to Executing Status"
                            description="This will start the procurement process"
                            setValue={setValue}
                            disabled={true}
                        />
                    </div>
                </div>
                <pre>{value} is selected</pre>
            </fieldset>
        </Accordion>
    );
};

export default AgreementActionAccordion;
