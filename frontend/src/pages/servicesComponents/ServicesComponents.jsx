// import App from "../../App";
// import ServiceReqTypeSelect from "./ServiceReqTypeSelect";
import ServicesComponentForm from "./ServicesComponentForm";
import ServicesComponentsList from "./ServicesComponentsList";
import ConfirmationModal from "../../components/UI/Modals/ConfirmationModal";
// import { initialFormData } from "./servicesComponents.constants";
import useServicesComponents from "./servicesComponents.hooks";
import DebugCode from "./DebugCode";

const ServicesComponents = ({ serviceRequirementType }) => {
    const {
        formData,
        modalProps,
        serviceTypeReq,
        servicesComponents,
        setFormData,
        setServiceTypeReq,
        setShowModal,
        showModal,
        handleSubmit,
        handleDelete,
        handleCancel,
        setFormDataById
    } = useServicesComponents();

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
                serviceTypeReq={serviceTypeReq}
            />
            <DebugCode
                title="service_requirement_type"
                data={serviceRequirementType}
            />
        </>
    );
};

export default ServicesComponents;
