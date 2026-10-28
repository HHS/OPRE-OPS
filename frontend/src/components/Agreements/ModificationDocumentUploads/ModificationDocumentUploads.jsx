import icons from "../../../uswds/img/sprite.svg";
import DisabledButtonWithTooltip from "../../UI/Button/DisabledButtonWithTooltip";

// Upload isn't available anywhere in OPS yet (the Documents tab is "coming soon"), so the
// actions are shown disabled, matching the pre-award approval page.
const UPLOAD_COMING_SOON =
    "Documents tab is coming soon! For now, please upload to the OPRE preferred tool to share documents";

const DOCUMENT_CARDS = [
    { documentType: "CONTRACT_MODIFICATION_MEMO", label: "Contract Modification Memo" },
    {
        documentType: "REVISED_INDEPENDENT_GOVERNMENT_COST_ESTIMATE",
        label: "Revised Independent Government Cost Estimate (IGCE)"
    },
    { documentType: "CERTIFICATION_OF_FUNDING", label: "Certificate of Funding" },
    { documentType: "REVISED_STATEMENT_OF_REQUIREMENTS", label: "Revised Statement of Requirements (SOW/PWS)" }
];

const toDataCy = (documentType) => `mod-document-${documentType.toLowerCase().replaceAll("_", "-")}`;

/**
 * The cloud-icon "Upload file" link, disabled until upload ships.
 * @param {Object} props
 * @param {string} props.label - What the link uploads, for its accessible name
 */
const UploadFileLink = ({ label }) => (
    <DisabledButtonWithTooltip
        label={UPLOAD_COMING_SOON}
        className="usa-button usa-button--unstyled display-flex flex-align-center text-no-wrap"
        ariaLabel={`Upload file: ${label}`}
    >
        <svg
            className="usa-icon usa-icon--size-3 margin-right-05"
            aria-hidden="true"
            focusable="false"
        >
            <use href={`${icons}#cloud`}></use>
        </svg>
        Upload file
    </DisabledButtonWithTooltip>
);

/**
 * The Upload Documents section of the Start Modification page (#3268): a 2×2 grid of document
 * cards, then an Additional Documents row.
 */
const ModificationDocumentUploads = () => (
    <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "2rem" }}>
            {DOCUMENT_CARDS.map(({ documentType, label }) => (
                <div
                    key={documentType}
                    className="display-flex flex-justify bg-base-lightest border-1px border-base-light radius-md padding-right-205"
                    style={{ minHeight: "90px", paddingLeft: "30px", gap: "0.5rem" }}
                    data-cy={toDataCy(documentType)}
                >
                    <span className="flex-1 font-12px text-base-dark padding-top-205 line-height-sans-5">{label}</span>
                    <div className="flex-auto padding-top-4">
                        <UploadFileLink label={label} />
                    </div>
                </div>
            ))}
        </div>
        <div
            className="display-flex flex-align-center margin-top-4"
            style={{ gap: "3.25rem" }}
            data-cy={toDataCy("ADDITIONAL_DOCUMENT")}
        >
            <div>
                <div className="text-ink">Additional Documents</div>
                <div className="text-base">Select one or more files (if applicable)</div>
            </div>
            <UploadFileLink label="Additional Documents" />
        </div>
    </>
);

export default ModificationDocumentUploads;
