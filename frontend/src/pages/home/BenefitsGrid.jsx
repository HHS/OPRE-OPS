import flourish from "../../images/flourish.svg";
import BenefitsCardsGrid from "./BenefitsCardsGrid";

const BenefitsGrid = () => (
    <>
        <section
            id="divider"
            className="display-flex flex-column flex-align-center margin-bottom-4"
        >
            <h2 className="text-brand-primary font-32px">OPS Benefits</h2>
            <img
                src={flourish}
                alt="flourish"
                width="94px"
            />
        </section>
        <BenefitsCardsGrid />
    </>
);

export default BenefitsGrid;
