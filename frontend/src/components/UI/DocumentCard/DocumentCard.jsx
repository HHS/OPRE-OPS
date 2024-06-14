import PropTypes from "prop-types";
import cssClasses from "./styles.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
/**
 * Renders an individual document
 * @component
 * @param {Object} props - The component props.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {string} [props.dataCy] - Data attribute for cypress tests
 * @param {Object} props.document - The document this card renders
 * @returns {JSX.Element} - The rendered component
 */
const DocumentCard = ({ className, dataCy, document, ...rest }) => {
    const cardContainer = `bg-base-lightest border-base-lighter font-family-sans display-flex ${cssClasses.container} ${className}`;
    const icon_class_names = `${cssClasses.eyeIcon} height-3 width-3`;
    const documentTitleClassNames = `${cssClasses.documentTitle} font-12px`;
    const uploaded_by_text = `Uploaded by ${document.uploaded_by} on ${document.upload_date}`;
    return (
        <div
            className={cardContainer}
            data-cy={dataCy ?? dataCy}
            {...rest}
        >
            <div className="display-flex flex-column margin-left-4 margin-top-205">
                <div className={documentTitleClassNames}>{document.title}</div>
                <div className="font-12px text-bold margin-top-05">{document.filename}</div>
                <div className="font-12px margin-top-05">
                    <span>{uploaded_by_text}</span> <span>{document.file_size}</span>
                </div>
            </div>
            <div className="display-flex">
                <FontAwesomeIcon
                    icon={faEye}
                    className={icon_class_names}
                />
            </div>
            <div className={cssClasses.cardAccent} />
        </div>
    );
};

DocumentCard.propTypes = {
    document: PropTypes.object.isRequired,
    className: PropTypes.string,
    dataCy: PropTypes.string,
    key: PropTypes.number
};

export default DocumentCard;
