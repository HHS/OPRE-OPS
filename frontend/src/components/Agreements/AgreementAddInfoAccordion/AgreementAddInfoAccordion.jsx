import Accordion from "../../UI/Accordion";
import ResearchTypeComboBox from "../../UI/Form/ResearchTypeComboBox";

const AgreementAddInfoAccordion = () => {
    return (
        <Accordion
            heading="Additional Information"
            level={2}
        >
            <p>Add additional information to the Agreement Details or come back to edit this later.</p>
            <div className="display-flex flex-justify">
                <ResearchTypeComboBox />
                <ResearchTypeComboBox />
            </div>
        </Accordion>
    );
};

export default AgreementAddInfoAccordion;
