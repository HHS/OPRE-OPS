import PropTypes from "prop-types";
import ServicesComponentForm from "./ServicesComponentForm";
import ServicesComponentsList from "./ServicesComponentsList";
import ConfirmationModal from "../../components/UI/Modals/ConfirmationModal";
import useServicesComponents from "./servicesComponents.hooks";
import DebugCode from "./DebugCode";

/**
 * ServicesComponents is a component that handles the display and functionality of service components.
 *
 * @component
 * @param {object} props
 * @param {string} props.serviceRequirementType - The type of service requirement.
 * @param {number} props.agreementId - The ID of the agreement.
 * @returns {JSX.Element}
 *
 * @example
 *  <ServicesComponents serviceRequirementType="SEVERABLE" agreementId={123} />
 */
const ServicesComponents = ({ serviceRequirementType, agreementId }) => {
    const {
        formData,
        modalProps,
        servicesComponents,
        setFormData,
        setShowModal,
        showModal,
        handleSubmit,
        handleDelete,
        handleCancel,
        setFormDataById
    } = useServicesComponents(agreementId);

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <section>
                <ServicesComponentForm
                    serviceTypeReq={serviceRequirementType}
                    formData={formData}
                    setFormData={setFormData}
                    handleSubmit={handleSubmit}
                    handleCancel={handleCancel}
                />
            </section>
            <ServicesComponentsList
                servicesComponents={servicesComponents}
                setFormDataById={setFormDataById}
                handleDelete={handleDelete}
                serviceTypeReq={serviceRequirementType}
            />
            <DebugCode
                title="service_requirement_type"
                data={serviceRequirementType}
            />
        </>
    );
};

ServicesComponents.propTypes = {
    serviceRequirementType: PropTypes.string.isRequired,
    agreementId: PropTypes.string.isRequired
};
export default ServicesComponents;
