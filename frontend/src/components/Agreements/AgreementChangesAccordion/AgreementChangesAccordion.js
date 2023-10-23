import React from "react";
import Accordion from "../../UI/Accordion";

function AgreementChangesAccordion({ children }) {
    return (
        <Accordion heading="hi mom">
            <div>hi mom</div>
            {children}
        </Accordion>
    );
}

export default AgreementChangesAccordion;
