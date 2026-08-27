import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * @component Renders the "pen icon + Editing..." indicator shown next to a form/section heading
 * while it is in edit mode.
 * @returns {React.ReactElement} The rendered component.
 */
function EditingIndicator() {
    return (
        <>
            <FontAwesomeIcon
                icon={faPen}
                size="2x"
                className="text-black height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                title="edit"
                data-position="top"
                aria-hidden="true"
            />
            <span className="text-black">Editing...</span>
        </>
    );
}

export default EditingIndicator;
