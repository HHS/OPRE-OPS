import { Link } from "react-router-dom";
import App from "../App";

const Home = () => {
    return (
        <App>
            <h1 style={{ textAlign: "center" }}>This is the OPRE OPS system prototype.</h1>
            <Link className="usa-button" to="/budget-lines/create">
                Create Budget Line
            </Link>
        </App>
    );
};

export default Home;
