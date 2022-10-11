import { Link } from "react-router-dom";
import Header from "./components/Header/Header";

function App() {
    return (
        <>
            <Header />
            <main>
                <h1>This is the OPRE OPS system prototype.</h1>

                <nav>
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
                </nav>
            </main>
        </>
    );
}

export default App;
