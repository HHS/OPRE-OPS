//

import {Link} from "react-router-dom";

const AgreementDetailsEdit = ({ agreement }) => {
    return (
        <div>
            <h2>Edit Metadata: This page is not yet implemented, but you can still&nbsp;
                <Link to={"/agreements/edit/" + agreement.id + "?mode=edit"}>
                    <span className="text-primary">edit in the wizard</span>
                </Link>
            </h2>
            <div style={{ background: "#cccccc", border: "1px dashed #999999" }}>
                <h2>TEMP DEBUG</h2>
                <pre>{JSON.stringify(agreement, null, 2)}</pre>
            </div>
        </div>
    );
};

export default AgreementDetailsEdit;
