import { faAdd, faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import EditingIndicator from "../../UI/EditingIndicator";
import FormHeader from "../../UI/Form/FormHeader";
import PeriodOfPerformanceFields from "../../UI/Form/PeriodOfPerformanceFields/PeriodOfPerformanceFields";
import TextArea from "../../UI/Form/TextArea";
import { NON_SEVERABLE_OPTIONS, SERVICE_REQ_TYPES, SEVERABLE_OPTIONS } from "../ServicesComponents.constants";
import ServicesComponentSelect from "../ServicesComponentSelect";

const NUMBER_LOCKED_HINT =
    "The Services Component number and Optional setting can't be changed after the agreement is awarded.";

/**
 * @typedef {Object} Formdata
 * @property {number} number
 * @property {string} popStartDate
 * @property {string} popEndDate
 * @property {string} description
 * @property {boolean} optional
 */

/**
 * @component ServicesComponentForm is a form component for creating and editing service components.
 * @param {Object} props - The properties object.
 * @param {string} props.serviceTypeReq - The type of service request.
 * @param {Formdata} props.formData - The form data.
 * @param {number} props.formKey - The form key.
 * @param {Function} props.setFormData - Function to set form data.
 * @param {React.FormEventHandler<HTMLFormElement>} props.handleSubmit - Function to handle form submission.
 * @param {Function} props.handleCancel - Function to handle form cancellation.
 * @param {number[]} props.servicesComponentsNumbers - The service component numbers.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @param {boolean} [props.isReviewMode] - Whether the form is in review mode (single-page edit screen).
 * @param {boolean} props.hasUnsavedChanges - Whether there are unsaved changes in the form.
 * @param {"agreement" | "none"} props.workflow - The workflow type.
 * @param {any} [props.scFormSuite] - Vest suite used to display field-level validation errors.
 * @param {boolean} [props.locksServicesComponentNumbers] - Whether a saved SC's number and Optional flag are locked (Awarded agreement, OPS-3268).
 * @returns {React.ReactElement} The rendered ServicesComponentForm component.
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
    isEditMode,
    isReviewMode = false,
    hasUnsavedChanges,
    workflow,
    scFormSuite,
    locksServicesComponentNumbers = false
}) {
    const [scSelectTouched, setScSelectTouched] = React.useState(false);
    React.useEffect(() => {
        setScSelectTouched(false);
    }, [formKey]);
    const [, forceUpdate] = React.useReducer((n) => n + 1, 0);
    React.useEffect(() => {
        if (!scFormSuite) return;
        scFormSuite.run({
            servicesComponentSelect: formData.number
        });
        forceUpdate();
    }, [formData.number, scFormSuite]);

    const suiteErrors = scFormSuite?.get();
    // On an Awarded agreement the contract refers to a saved SC by its number, so it (and the
    // Optional flag) can't change; its period of performance and description still can (OPS-3268).
    const isNumberLocked = locksServicesComponentNumbers && formData?.mode === "edit" && "created_on" in formData;

    if (!serviceTypeReq) {
        return (
            <p className="text-center margin-y-7 text-error">Please add a Service Requirement Type to the Agreement.</p>
        );
    }

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

    const heading = isEditMode || isReviewMode ? "Edit Services Components" : "Create Services Components";
    let details;
    if (isReviewMode) {
        details = undefined;
    } else if (isEditMode) {
        details = "When adding a new SC, a Services Component must be selected from the dropdown.";
    } else {
        details =
            "Create the structure of the agreement using Services Components to describe the work being done. After you outline the Services Components, you will add Budget Lines to fund that work. When adding a new SC, a Services Component must be selected from the dropdown.";
    }

    return (
        <form
            onSubmit={handleSubmit}
            id="services-component-form"
            className={isReviewMode ? "margin-top-8" : undefined}
        >
            <FormHeader
                heading={heading}
                details={details}
                actions={isEditMode && <EditingIndicator />}
            />
            <div className="grid-row flex-row">
                <div className="grid-col flex-2">
                    <div className="grid-row flex-row flex-justify">
                        <div style={{ width: "17rem" }}>
                            <ServicesComponentSelect
                                onChange={(name, value) => {
                                    setScSelectTouched(true);
                                    setFormData({
                                        ...formData,
                                        number: +value,
                                        optional: false
                                    });
                                }}
                                // A disabled Select shows its value as-is, so show the SC's label.
                                value={
                                    isNumberLocked
                                        ? (options.find((option) => option.value === formData.number)?.label ??
                                          formData.number)
                                        : formData?.number || ""
                                }
                                options={optionsWithSelected}
                                isRequired={true}
                                messages={
                                    scSelectTouched ? (suiteErrors?.getErrors("servicesComponentSelect") ?? []) : []
                                }
                                isDisabled={isNumberLocked}
                                hint={isNumberLocked ? NUMBER_LOCKED_HINT : ""}
                                tooltipMsg={isNumberLocked ? NUMBER_LOCKED_HINT : ""}
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
                                    // Locked with the SC number: point to the hint that says why.
                                    aria-describedby={isNumberLocked ? "servicesComponentSelect-hint" : undefined}
                                    disabled={
                                        isNumberLocked ||
                                        formData?.number === 0 ||
                                        formData?.number === 1 ||
                                        formData?.number === ""
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
                    <PeriodOfPerformanceFields
                        formKey={formKey}
                        formData={formData}
                        setFormData={setFormData}
                    />
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

            <div className="display-flex flex-justify margin-top-2">
                {hasUnsavedChanges && workflow != "agreement" && (
                    <div
                        className="margin-top-2 margin-bottom-1 radius-md usa-alert--warning"
                        style={{ display: "inline-block", width: "fit-content", padding: "4px" }}
                    >
                        <FontAwesomeIcon icon={faWarning}></FontAwesomeIcon> Unsaved Changes
                    </div>
                )}
                <div className="margin-left-auto">
                    {formData.mode === "edit" ? (
                        <>
                            <button
                                type="button"
                                className="usa-button--unstyled margin-right-2 cursor-pointer"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                className="usa-button usa-button--outline margin-right-0"
                                data-cy="update-services-component-btn"
                            >
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
            </div>
        </form>
    );
}

export default ServicesComponentForm;
