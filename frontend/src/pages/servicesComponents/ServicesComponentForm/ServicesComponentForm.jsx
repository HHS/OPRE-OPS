import ServicesComponentSelect from "../ServicesComponentSelect";
import PoPStartDate from "../PoPStartDate";
import PoPEndDate from "../PoPEndDate";
import TextArea from "../../../components/UI/Form/TextArea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import { NON_SEVERABLE_OPTIONS, SEVERABLE_OPTIONS, SERVICE_REQ_TYPES } from "../servicesComponents.constants";
import DebugCode from "../DebugCode";

function ServicesComponentForm({ serviceTypeReq, formData, setFormData, handleSubmit, handleCancel }) {
    const options = serviceTypeReq === SERVICE_REQ_TYPES.SEVERABLE ? SEVERABLE_OPTIONS : NON_SEVERABLE_OPTIONS;

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="font-sans-lg">Create Services Components</h2>
            <p>
                Create the structure of the agreement using Services Components to describe the work being done. After
                you outline the Services Components, you will add Budget Lines to fund that work.
            </p>
            <div className="display-flex margin-top-3">
                <section>
                    <fieldset className="usa-fieldset display-flex flex-align-center">
                        <ServicesComponentSelect
                            onChange={(name, value) => {
                                setFormData({
                                    ...formData,
                                    number: value
                                });
                            }}
                            value={formData?.number || ""}
                            options={options}
                        />
                        {serviceTypeReq === SERVICE_REQ_TYPES.NON_SEVERABLE && (
                            <div className="usa-checkbox margin-left-5">
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
                                />
                                <label
                                    className="usa-checkbox__label"
                                    htmlFor="optional-services-component"
                                >
                                    Optional Services Component
                                </label>
                            </div>
                        )}
                    </fieldset>
                    <div className="display-flex flex-align-center margin-top-3">
                        <PoPStartDate
                            serviceComponent={formData}
                            setServiceComponent={setFormData}
                        />
                        <PoPEndDate
                            serviceComponent={formData}
                            setServiceComponent={setFormData}
                        />
                    </div>
                </section>
                <section
                    className="usa-fieldset margin-top-neg-2 margin-left-auto"
                    style={{ width: "20.8125rem" }}
                >
                    <TextArea
                        name="description"
                        label="Description"
                        maxLength={150}
                        value={formData?.description || ""}
                        onChange={(name, value) => setFormData({ ...formData, description: value })}
                    />
                </section>
            </div>
            <div className="display-flex flex-justify-end margin-top-2">
                {formData.mode === "edit" ? (
                    <>
                        <button
                            className="usa-button--unstyled margin-right-2"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button className="usa-button usa-button--outline margin-right-0">
                            Update Services Component
                        </button>
                    </>
                ) : (
                    <button className="usa-button usa-button--outline margin-right-0">
                        <FontAwesomeIcon
                            icon={faAdd}
                            className="height-2 width-2"
                        />
                        Add Services Component
                    </button>
                )}
            </div>
            <DebugCode
                title="Form Data"
                data={formData}
            />
        </form>
    );
}

export default ServicesComponentForm;
