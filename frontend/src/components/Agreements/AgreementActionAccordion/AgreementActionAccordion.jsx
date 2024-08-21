import PropTypes from "prop-types";
import RadioButtonTile from "../../UI/RadioButtonTile";
import Accordion from "../../UI/Accordion";
import { actionOptions } from "../../../pages/agreements/review/ReviewAgreement.constants";

/**
 * Renders an accordion component with two radio button tiles for selecting an action.
 * @component
 * @param {Object} props - The component props.
 * @param {Function} props.setAction - The function to call when an action is selected.
 * @param {boolean} [props.optionOneDisabled=false] - Whether the first radio button tile should be disabled.
 * @param {boolean} [props.optionTwoDisabled=false] - Whether the second radio button tile should be disabled.
 * @returns {JSX.Element} - The rendered component.
 */
const AgreementActionAccordion = ({ setAction, optionOneDisabled = false, optionTwoDisabled = false }) => {
    return (
        <Accordion
            heading="Choose a Status Change"
            level={2}
        >
            <fieldset className="usa-fieldset">
                <legend className="usa-legend maxw-full margin-bottom-2 margin-top-0">
                    Choose which status you&apos;d like to change budget lines to.
                </legend>
                <div className="grid-row grid-gap">
                    <div className="grid-col">
                        <RadioButtonTile
                            label={actionOptions.CHANGE_DRAFT_TO_PLANNED}
                            description="This will subtract the amounts from the FY budget"
                            setValue={setAction}
                            disabled={optionOneDisabled}
                            data-cy="change-draft-to-planned"
                        />
                    </div>
                    <div className="grid-col">
                        <RadioButtonTile
                            label={actionOptions.CHANGE_PLANNED_TO_EXECUTING}
                            description="This will start the procurement process"
                            setValue={setAction}
                            disabled={optionTwoDisabled}
                            data-cy="change-planned-to-executing"
                        />
                    </div>
                </div>
            </fieldset>
        </Accordion>
    );
};

AgreementActionAccordion.propTypes = {
    setAction: PropTypes.func.isRequired,
    optionOneDisabled: PropTypes.bool,
    optionTwoDisabled: PropTypes.bool
};

export default AgreementActionAccordion;
