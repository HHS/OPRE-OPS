import { useEffect, useState } from "react";
import SimpleAlert from "../../UI/Alert/SimpleAlert";

/**
 * Live region for an editor that is waiting for fresh data (see useEditorSeedGate).
 *
 * Render it before there's anything to say and keep it mounted: screen readers reliably announce text added to a
 * live region that's already on the page, but often skip a region that's inserted together with its text. The
 * region is therefore always committed empty first (even when a page mounts already waiting, e.g. from a
 * `?mode=edit` link), and the text is added in the next update.
 * @param {Object} props
 * @param {boolean} props.isWaiting - Whether the editor is waiting for its data.
 * @param {boolean} props.isSlow - Whether it has been waiting long enough to tell the user how to get out.
 * @param {string} props.slowMessage - What to tell the user once the wait is slow.
 * @param {string} [props.waitingText] - Short text to show (and announce) as soon as the wait starts.
 * @param {number} [props.headingLevel=3] - Heading level of the "Still loading" alert, to fit the page's outline.
 * @returns {JSX.Element}
 */
const EditorLoadingStatus = ({ isWaiting, isSlow, slowMessage, waitingText, headingLevel = 3 }) => {
    const [isRegionMounted, setIsRegionMounted] = useState(false);
    useEffect(() => setIsRegionMounted(true), []);
    const showStatus = isRegionMounted && isWaiting;

    return (
        <div role="status">
            {showStatus && waitingText && <p>{waitingText}</p>}
            {showStatus && isSlow && (
                <SimpleAlert
                    type="info"
                    heading="Still loading"
                    headingLevel={headingLevel}
                    message={slowMessage}
                />
            )}
        </div>
    );
};

export default EditorLoadingStatus;
