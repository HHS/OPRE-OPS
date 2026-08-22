import Accordion from "../../UI/Accordion";

/**
 * @component GrantNumberAccordion wraps its children in an Accordion titled by grant number.
 * Grant analog of ServicesComponentAccordion. Grant numbers have no sub-component or
 * service-requirement type, so the title is simply "Grant {number} of {total}".
 * @param {Object} props - The properties passed to this component.
 * @param {number} props.grantNumberNumber - The grant number.
 * @param {number} [props.totalGrantNumbers] - The total count of grant numbers on the agreement (optional).
 *   When omitted, the heading falls back to "Grant {number}" with no "of {total}" suffix.
 * @param {boolean} [props.isError] - When true, renders a red error border around the accordion.
 * @param {React.ReactNode} props.children - The child elements to be wrapped in the Accordion.
 * @returns {JSX.Element} - The rendered component.
 */
function GrantNumberAccordion({ grantNumberNumber, totalGrantNumbers, isError = false, children }) {
    const grantNumberDisplayTitle =
        grantNumberNumber === 0
            ? "BLs not associated with a Grant Number"
            : totalGrantNumbers
              ? `Grant ${grantNumberNumber} of ${totalGrantNumbers}`
              : `Grant ${grantNumberNumber}`;

    return (
        <Accordion
            heading={grantNumberDisplayTitle}
            level={3}
            isError={isError}
        >
            {children}
        </Accordion>
    );
}

export default GrantNumberAccordion;
