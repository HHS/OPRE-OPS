import { Link } from "react-router-dom";
import { BreadcrumbList } from "./pages/UI/Breadcrumb";

function App() {
    return (
        <>
            <BreadcrumbList isCurrent />
            <div className="usa-alert usa-alert--error" role="alert">
                <div className="usa-alert__body">
                    <h4 className="usa-alert__heading">Under Construction</h4>
                    <p className="usa-alert__text">This is a developer prototype, please do not judge me</p>
                </div>
            </div>

            <h1>This is the OPRE OPS system prototype.</h1>

            <table className="usa-table usa-table--borderless">
                <caption>Workflows</caption>
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Path</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">Portfolios</th>
                        <td>
                            <Link to="portfolios">/portfolios</Link>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">CANs</th>
                        <td>
                            <Link to="cans">/cans</Link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    );
}

export default App;
