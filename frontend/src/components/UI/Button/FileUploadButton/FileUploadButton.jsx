import { useRef } from "react";
import PropTypes from "prop-types";
import Tooltip from "../../USWDS/Tooltip/Tooltip";
import icons from "../../../../uswds/img/sprite.svg";

/**
 * FileUploadButton is a reusable file upload/download card component that displays
 * as a clickable card with filename display and action icon. The entire card
 * is clickable and triggers either a file input (upload) or download callback.
 * Supports disabled states with optional tooltip explanations and hover effects.
 *
 * @component
 * @param {Object} props - The properties passed to this component
 * @param {string} props.id - Required unique ID for the button/input element
 * @param {Function} [props.onFileChange] - Callback when file is selected (upload variant)
 * @param {Function} [props.onDownload] - Callback when download is triggered (download variant)
 * @param {Object} [props.selectedFile] - Currently selected file object to display name
 * @param {string} [props.label="Upload File"] - Placeholder text when no file selected
 * @param {string} [props.acceptedFileTypes="*"] - Accepted file types (e.g., ".pdf,.doc,.docx")
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {string} [props.disabledTooltip] - Tooltip message to show when disabled
 * @param {string} [props.buttonText="Upload File"] - Text to display next to icon
 * @param {string} [props.width="450px"] - Width of the card
 * @param {string} [props.minHeight="100px"] - Minimum height of the card
 * @param {string} [props.className] - Additional CSS classes to apply
 * @param {Object} [props.style] - Additional inline styles to apply
 * @param {string} [props.name] - Name attribute for the file input (defaults to id, upload only)
 * @param {"upload"|"download"} [props.variant="upload"] - Button variant: "upload" or "download"
 * @returns {JSX.Element} The rendered FileUploadButton card component
 *
 * @example
 * // Upload variant
 * <FileUploadButton
 *     id="document-upload"
 *     acceptedFileTypes=".pdf,.doc,.docx"
 *     onFileChange={handleFileChange}
 *     selectedFile={file}
 *     label="Final Consensus Memo"
 *     disabled={isUploading}
 *     disabledTooltip="Upload in progress..."
 *     buttonText="Upload File"
 * />
 *
 * @example
 * // Download variant
 * <FileUploadButton
 *     id="document-download"
 *     variant="download"
 *     onDownload={handleDownload}
 *     label="Final Consensus Memo"
 *     disabled={true}
 *     disabledTooltip="Documents coming soon!"
 *     buttonText="Download File"
 * />
 */
function FileUploadButton({
    id,
    onFileChange,
    onDownload,
    selectedFile,
    label = "Upload File",
    acceptedFileTypes = "*",
    disabled = false,
    disabledTooltip,
    buttonText = "Upload File",
    width = "450px",
    minHeight = "100px",
    className = "",
    style = {},
    name,
    variant = "upload"
}) {
    const fileInputRef = useRef(null);

    const handleButtonClick = () => {
        if (disabled) return;

        if (variant === "download" && onDownload) {
            onDownload();
        } else if (variant === "upload" && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const buttonClasses = disabled
        ? "display-flex flex-column padding-2 radius-lg border-2px bg-base-lighter border-base-light cursor-not-allowed"
        : `display-flex flex-column padding-2 radius-lg border-2px bg-white hover:bg-base-lightest border-base-light hover:border-base-lighter cursor-pointer ${className}`.trim();

    const buttonElement = (
        <button
            type="button"
            onClick={handleButtonClick}
            disabled={disabled}
            aria-label={selectedFile ? selectedFile.name : label}
            className={buttonClasses}
            style={{
                width,
                minHeight,
                justifyContent: "space-between",
                background: "none",
                font: "inherit",
                textAlign: "left",
                pointerEvents: disabled ? "none" : "auto",
                ...style
            }}
        >
            {/* Filename display section */}
            <div>
                <span style={{ fontSize: "0.875rem", color: disabled ? "#c9c9c9" : "#757575" }}>
                    {selectedFile ? selectedFile.name : label}
                </span>
            </div>

            {/* Action icon section */}
            <div style={{ display: "flex", justifyContent: "end", alignItems: "center", marginTop: "0.5rem" }}>
                {variant === "upload" ? (
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
                ) : (
                    <svg
                        className="usa-icon"
                        aria-hidden="true"
                        focusable="false"
                        style={{ fill: disabled ? "#757575" : "#005ea2", width: "24px", height: "24px" }}
                    >
                        <use href={`${icons}#file_download`}></use>
                    </svg>
                )}
                {buttonText && (
                    <span style={{ textDecoration: "underline", fontSize: "1rem", marginLeft: "0.5rem" }}>
                        {buttonText}
                    </span>
                )}
            </div>
        </button>
    );

    return (
        <>
            {disabled && disabledTooltip ? (
                <Tooltip
                    label={disabledTooltip}
                    position="top"
                >
                    <div
                        style={{
                            display: "inline-block",
                            cursor: "not-allowed"
                        }}
                    >
                        {buttonElement}
                    </div>
                </Tooltip>
            ) : (
                buttonElement
            )}
            {variant === "upload" && (
                <input
                    ref={fileInputRef}
                    id={id}
                    type="file"
                    name={name || id}
                    accept={acceptedFileTypes}
                    onChange={onFileChange}
                    disabled={disabled}
                    style={{ display: "none" }}
                />
            )}
        </>
    );
}

FileUploadButton.propTypes = {
    id: PropTypes.string.isRequired,
    onFileChange: PropTypes.func,
    onDownload: PropTypes.func,
    selectedFile: PropTypes.object,
    label: PropTypes.string,
    acceptedFileTypes: PropTypes.string,
    disabled: PropTypes.bool,
    disabledTooltip: PropTypes.string,
    buttonText: PropTypes.string,
    width: PropTypes.string,
    minHeight: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    name: PropTypes.string,
    variant: PropTypes.oneOf(["upload", "download"])
};

export default FileUploadButton;
