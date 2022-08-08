import family from "./family.svg";
import { Link } from "react-router-dom";

function App() {
    return (
        <main>
            <div className="flex">
                <div className="one">
                    <div className="rounded-box flex" id="title-box">
                        <p>
                            This is the OPRE
                            <br />
                            OPS system prototype.
                        </p>
                        <img alt="family" src={family} className="illustration" />
                    </div>
                </div>
                <div className="two">
                    <div className="rounded-box">
                        <table>
                            <caption>Workflows</caption>
                            <tbody>
                                <tr>
                                    <th>Name</th>
                                    <th>Path</th>
                                </tr>
                                <tr>
                                    <td>CANs</td>
                                    <td>
                                        <Link to="cans">/cans</Link>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default App;
