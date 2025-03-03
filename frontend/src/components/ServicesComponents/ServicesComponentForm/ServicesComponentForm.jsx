import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import ServicesComponentSelect from "../ServicesComponentSelect";
import TextArea from "../../UI/Form/TextArea";
import FormHeader from "../../UI/Form/FormHeader";
import { NON_SEVERABLE_OPTIONS, SEVERABLE_OPTIONS, SERVICE_REQ_TYPES } from "../ServicesComponents.constants";
import DateRangePickerWrapper from "../../UI/USWDS/DateRangePickerWrapper";
import DatePicker from "../../UI/USWDS/DatePicker";

/**
 * ServicesComponentForm is a form component for creating and editing service components.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {string} props.serviceTypeReq - The type of service request.
 * @param {Object} props.formData - The form data.
 * @param {string} props.formKey - The form key.
 * @param {Function} props.setFormData - Function to set form data.
 * @param {Function} props.handleSubmit - Function to handle form submission.
 * @param {Function} props.handleCancel - Function to handle form cancellation.
 * @param {Array<number>} props.servicesComponentsNumbers - The service component numbers.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @returns {JSX.Element} The rendered ServicesComponentForm component.
 *
 * @example
 * <ServicesComponentForm serviceTypeReq="SEVERABLE" formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} handleCancel={handleCancel} />
 */
function ServicesComponentForm({
    serviceTypeReq,
    formData,
    formKey,
    setFormData,
    handleSubmit,
    handleCancel,
    servicesComponentsNumbers = [],
    isEditMode
}) {
    const options = serviceTypeReq === SERVICE_REQ_TYPES.SEVERABLE ? SEVERABLE_OPTIONS : NON_SEVERABLE_OPTIONS;
    const optionsWithSelected = options.map((option) => {
        if (servicesComponentsNumbers.includes(option.value)) {
            return {
                ...option,
                disabled: true
            };
        }
        return option;
    });

    const heading = isEditMode ? "Edit Services Components" : "Create Services Components";
    const details = isEditMode
        ? "When adding a new SC, a Services Component must be selected from the dropdown."
        : "Create the structure of the agreement using Services Components to describe the work being done. After you outline the Services Components, you will add Budget Lines to fund that work. When adding a new SC, a Services Component must be selected from the dropdown.";

    return (
        <form onSubmit={handleSubmit} id="services-component-form">
            <FormHeader
                heading={heading}
                details={details}
            />
            <div className="grid-row flex-row">
                <div className="grid-col flex-2">
                    <div className="grid-row flex-row flex-justify">
                        <div style={{ width: "16.25rem" }}>
                            <ServicesComponentSelect
                                onChange={(name, value) => {
                                    setFormData({
                                        ...formData,
                                        number: +value,
                                        optional: false
                                    });
                                }}
                                value={formData?.number || ""}
                                options={optionsWithSelected}
                                isRequired={true}
                            />
                        </div>
                        {serviceTypeReq === SERVICE_REQ_TYPES.NON_SEVERABLE ? (
                            <div className="usa-checkbox margin-top-4 margin-right-3">
                                <input
                                    className="usa-checkbox__input"
                                    id="optional-services-component"
                                    type="checkbox"
                                    name="optional-services-checkbox"
                                    value={formData?.optional || ""}
                                    checked={formData?.optional}
                                    onChange={() => {
                                        setFormData({
                                            ...formData,
                                            optional: !formData?.optional
                                        });
                                    }}
                                    disabled={
                                        formData?.number === 0 || formData?.number === 1 || formData?.number === ""
                                    }
                                />
                                <label
                                    className="usa-checkbox__label"
                                    htmlFor="optional-services-component"
                                >
                                    Optional Services Component
                                </label>
                            </div>
                        ) : (
                            <div style={{ height: "3.90rem" }} />
                        )}
                    </div>
                    <DateRangePickerWrapper
                        id="period-of-performance"
                        key={formKey}
                        className="display-flex flex-justify"
                    >
                        <DatePicker
                            id="pop-start-date"
                            name="pop-start-date"
                            label="Period of Performance-Start"
                            hint="mm/dd/yyyy"
                            value={formData.popStartDate}
                            onChange={(e) =>
                                setFormData((currentFormData) => ({
                                    ...currentFormData,
                                    popStartDate: e.target.value
                                }))
                            }
                        />
                        <DatePicker
                            id="pop-end-date"
                            name="pop-end-date"
                            label="Period of Performance-End"
                            hint="mm/dd/yyyy"
                            value={formData.popEndDate}
                            onChange={(e) =>
                                setFormData((currentFormData) => ({
                                    ...currentFormData,
                                    popEndDate: e.target.value
                                }))
                            }
                        />
                    </DateRangePickerWrapper>
                </div>
                <div className="grid-col margin-left-5">
                    <TextArea
                        name="description"
                        label="Description"
                        className="margin-top-0"
                        maxLength={150}
                        value={formData?.description || ""}
                        onChange={(name, value) => setFormData({ ...formData, description: value })}
                    />
                </div>
            </div>

            <div className="display-flex flex-justify-end margin-top-2">
                {formData.mode === "edit" ? (
                    <>
                        <button
                            className="usa-button--unstyled margin-right-2 cursor-pointer"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button className="usa-button usa-button--outline margin-right-0">
                            Update Services Component
                        </button>
                    </>
                ) : (
                    <button
                        className="usa-button usa-button--outline margin-right-0"
                        data-cy="add-services-component-btn"
                    >
                        <FontAwesomeIcon
                            icon={faAdd}
                            className="height-2 width-2"
                        />
                        Add Services Component
                    </button>
                )}
            </div>
        </form>
    );
}

ServicesComponentForm.propTypes = {
    serviceTypeReq: PropTypes.string.isRequired,
    formData: PropTypes.object.isRequired,
    formKey: PropTypes.string.isRequired,
    setFormData: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
    servicesComponentsNumbers: PropTypes.array,
    isEditMode: PropTypes.bool
};

export default ServicesComponentForm;
