import Accordion from "../../UI/Accordion";
import ResearchTypeComboBox from "../ResearchTypeComboBox";
import SpecialTopicComboBox from "../SpecialTopicComboBox";

const AgreementAddInfoAccordion = () => {
    return (
        <Accordion
            heading="Additional Information"
            level={2}
        >
            <p>Add additional information to the Agreement Details or come back to edit this later.</p>
            <div
                className="display-flex flex-justify"
                style={{ gridGap: "1rem" }}
            >
                <ResearchTypeComboBox />
                <SpecialTopicComboBox />
            </div>
        </Accordion>
    );
};

export default AgreementAddInfoAccordion;
