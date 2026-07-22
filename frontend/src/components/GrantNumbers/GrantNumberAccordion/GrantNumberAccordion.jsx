import Accordion from "../../UI/Accordion";

/**
 * @component GrantNumberAccordion wraps its children in an Accordion titled by grant number.
 * Grant analog of ServicesComponentAccordion. Grant numbers have no sub-component or
 * service-requirement type, so the title is simply "Grant {number}".
 * @param {Object} props - The properties passed to this component.
 * @param {number} props.grantNumberNumber - The grant number.
 * @param {React.ReactNode} props.children - The child elements to be wrapped in the Accordion.
 * @returns {JSX.Element} - The rendered component.
 */
function GrantNumberAccordion({ grantNumberNumber, children }) {
    const grantNumberDisplayTitle =
        grantNumberNumber === 0 ? "BLs not associated with a Grant Number" : `Grant ${grantNumberNumber}`;

    return (
        <Accordion
            heading={grantNumberDisplayTitle}
            level={3}
        >
            {children}
        </Accordion>
    );
}

export default GrantNumberAccordion;
