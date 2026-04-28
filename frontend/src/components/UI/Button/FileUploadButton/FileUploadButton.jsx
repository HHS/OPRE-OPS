import PropTypes from "prop-types";
import Tooltip from "../../USWDS/Tooltip/Tooltip";

/**
 * FileUploadButton is a reusable file upload trigger component that displays
 * a clickable label with an upload icon. It includes a hidden file input and
 * supports disabled states with optional tooltip explanations.
 *
 * @component
 * @param {Object} props - The properties passed to this component
 * @param {string} props.id - Required unique ID for the file input element
 * @param {Function} props.onFileChange - Required callback when file is selected
 * @param {string} [props.acceptedFileTypes="*"] - Accepted file types (e.g., ".pdf,.doc,.docx")
 * @param {boolean} [props.disabled=false] - Whether the upload button is disabled
 * @param {string} [props.disabledTooltip] - Tooltip message to show when disabled (only shown if disabled=true)
 * @param {string} [props.buttonText="Upload File"] - Text to display on the button
 * @param {string} [props.className] - Additional CSS classes to apply to the label
 * @param {Object} [props.style] - Additional inline styles to apply to the label
 * @param {string} [props.name] - Name attribute for the file input (defaults to id if not provided)
 * @returns {JSX.Element} The rendered FileUploadButton component
 *
 * @example
 * <FileUploadButton
 *     id="document-upload"
 *     acceptedFileTypes=".pdf,.doc,.docx"
 *     onFileChange={handleFileChange}
 *     disabled={isUploading}
 *     disabledTooltip="Upload in progress..."
 *     buttonText="Upload Document"
 * />
 */
function FileUploadButton({
    id,
    onFileChange,
    acceptedFileTypes = "*",
    disabled = false,
    disabledTooltip,
    buttonText = "Upload File",
    className = "",
    style = {},
    name
}) {
    const baseStyles = {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        color: disabled ? "#c9c9c9" : "#757575",
        fontSize: "0.875rem"
    };

    const mergedStyles = { ...baseStyles, ...style };

    const cursorClass = disabled ? "cursor-not-allowed" : "cursor-pointer";

    const labelElement = (
        <label
            htmlFor={id}
            className={`${cursorClass} ${className}`.trim()}
            style={mergedStyles}
        >
            <svg
                className="usa-icon"
                aria-hidden="true"
                focusable="false"
                role="img"
                viewBox="0 0 24 24"
                style={{ fill: "currentColor", width: "32px", height: "32px" }}
            >
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
            <span style={{ textDecoration: "underline", fontSize: "1rem" }}>{buttonText}</span>
        </label>
    );

    return (
        <>
            {disabled && disabledTooltip ? (
                <Tooltip
                    label={disabledTooltip}
                    position="top"
                >
                    {labelElement}
                </Tooltip>
            ) : (
                labelElement
            )}
            <input
                id={id}
                type="file"
                name={name || id}
                accept={acceptedFileTypes}
                onChange={onFileChange}
                disabled={disabled}
                style={{ display: "none" }}
            />
        </>
    );
}

FileUploadButton.propTypes = {
    id: PropTypes.string.isRequired,
    onFileChange: PropTypes.func.isRequired,
    acceptedFileTypes: PropTypes.string,
    disabled: PropTypes.bool,
    disabledTooltip: PropTypes.string,
    buttonText: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    name: PropTypes.string
};

export default FileUploadButton;
