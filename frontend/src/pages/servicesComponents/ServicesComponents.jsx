import App from "../../App";
import ServiceReqTypeSelect from "./ServiceReqTypeSelect";
import ServicesComponentForm from "./ServicesComponentForm";
import ServicesComponentsList from "./ServicesComponentsList";
import ConfirmationModal from "../../components/UI/Modals/ConfirmationModal";
import { initialFormData } from "./servicesComponents.constants";
import useServicesComponents from "./servicesComponents.hooks";

const ServicesComponents = () => {
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
        <App breadCrumbName="Playground">
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
                <h1>Services Components Playground</h1>
                <ServiceReqTypeSelect
                    value={serviceTypeReq}
                    onChange={(name, value) => {
                        setServiceTypeReq(value);
                        setFormData(initialFormData);
                    }}
                />
                <ServicesComponentForm
                    serviceTypeReq={serviceTypeReq}
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
        </App>
    );
};

export default ServicesComponents;
