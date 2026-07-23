import { faAdd, faPen, faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FormHeader from "../../UI/Form/FormHeader";
import TextArea from "../../UI/Form/TextArea";
import DatePicker from "../../UI/USWDS/DatePicker";
import DateRangePickerWrapper from "../../UI/USWDS/DateRangePickerWrapper";
import { GRANT_NUMBER_OPTIONS } from "../GrantNumbers.constants";
import GrantNumberSelect from "../GrantNumberSelect";

/**
 * @typedef {Object} Formdata
 * @property {number} number
 * @property {string} popStartDate
 * @property {string} popEndDate
 * @property {string} description
 */

/**
 * @component GrantNumberForm is a form component for creating and editing grant numbers.
 * @param {Object} props - The properties object.
 * @param {Formdata} props.formData - The form data.
 * @param {number} props.formKey - The form key.
 * @param {Function} props.setFormData - Function to set form data.
 * @param {React.FormEventHandler<HTMLFormElement>} props.handleSubmit - Function to handle form submission.
 * @param {Function} props.handleCancel - Function to handle form cancellation.
 * @param {number[]} props.grantNumbersNumbers - The grant numbers already in use.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @param {boolean} [props.isReviewMode] - Whether the form is in review mode (single-page edit screen).
 * @param {boolean} props.hasUnsavedChanges - Whether there are unsaved changes in the form.
 * @param {"agreement" | "none"} props.workflow - The workflow type.
 * @returns {React.ReactElement} The rendered GrantNumberForm component.
 *
 * @example
 * <GrantNumberForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} handleCancel={handleCancel} />
 */
function GrantNumberForm({
    formData,
    formKey,
    setFormData,
    handleSubmit,
    handleCancel,
    grantNumbersNumbers = [],
    isEditMode,
    isReviewMode = false,
    hasUnsavedChanges,
    workflow
}) {
    const optionsWithSelected = GRANT_NUMBER_OPTIONS.map((option) => {
        if (grantNumbersNumbers.includes(option.value)) {
            return {
                ...option,
                disabled: true
            };
        }
        return option;
    });

    const heading = isEditMode || isReviewMode ? "Edit Grant Numbers" : "Create Grant Numbers";
    const details = isReviewMode ? undefined : "Add a placeholder Grant Number until the award is finalized.";

    return (
        <form
            onSubmit={handleSubmit}
            id="grant-number-form"
            className={isReviewMode ? "margin-top-8" : undefined}
        >
            <div className="display-flex flex-align-center">
                <div>
                    <FormHeader
                        heading={heading}
                        details={details}
                    />
                </div>
                {isEditMode && (
                    <div className="margin-left-auto">
                        <FontAwesomeIcon
                            icon={faPen}
                            size="2x"
                            className="text-black height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                            title="edit"
                            data-position="top"
                        />
                        <span
                            id="editing"
                            className="text-black"
                        >
                            Editing...
                        </span>
                    </div>
                )}
            </div>
            <div className="grid-row flex-row">
                <div className="grid-col flex-2">
                    <div className="grid-row flex-row flex-justify">
                        <div style={{ width: "17rem" }}>
                            <GrantNumberSelect
                                onChange={(name, value) => {
                                    setFormData({
                                        ...formData,
                                        number: +value
                                    });
                                }}
                                value={formData?.number || ""}
                                options={optionsWithSelected}
                                isRequired={true}
                            />
                            <p className="usa-hint margin-top-1">Placeholder grant # until award</p>
                        </div>
                    </div>
                    <DateRangePickerWrapper
                        id="grant-number-period-of-performance"
                        key={formKey}
                        className="display-flex flex-justify "
                    >
                        <div style={{ width: "275px" }}>
                            <DatePicker
                                id="grant-number-pop-start-date"
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
                        </div>
                        <div style={{ width: "275px" }}>
                            <DatePicker
                                id="grant-number-pop-end-date"
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
                        </div>
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
                                data-cy="update-grant-number-btn"
                            >
                                Update Grant Number
                            </button>
                        </>
                    ) : (
                        <button
                            className="usa-button usa-button--outline margin-right-0"
                            data-cy="add-grant-number-btn"
                        >
                            <FontAwesomeIcon
                                icon={faAdd}
                                className="height-2 width-2"
                            />
                            Add Grant Number
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default GrantNumberForm;
