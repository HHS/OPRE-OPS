import { faAdd, faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EditingIndicator from "../../UI/EditingIndicator";
import FormHeader from "../../UI/Form/FormHeader";
import PeriodOfPerformanceFields from "../../UI/Form/PeriodOfPerformanceFields/PeriodOfPerformanceFields";
import TextArea from "../../UI/Form/TextArea";
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
    const details = isReviewMode
        ? undefined
        : "Create the structure of the agreement using Grant Numbers to describe the grants within it.  After you outline the Grant Numbers, you will add Budget Lines to fund them.";

    return (
        <form
            onSubmit={handleSubmit}
            id="grant-number-form"
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
                                hint="Placeholder grant # until award"
                            />
                        </div>
                    </div>
                    <PeriodOfPerformanceFields
                        idPrefix="grant-number-"
                        formKey={formKey}
                        formData={formData}
                        setFormData={setFormData}
                    />
                </div>
                <div className="grid-col margin-left-5">
                    <TextArea
                        name="description"
                        label="Description (optional)"
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
