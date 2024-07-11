import App from "../App";
import RoundedBox from "../components/UI/RoundedBox";

const Home = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                <RoundedBox className="padding-x-2 margin-top-2 display-inline-block text-center">
                    <h1>This is the OPRE OPS system prototype</h1>
                    <p>⚠️Something New</p>
                </RoundedBox>
            </div>
        </App>
    );
};

export default Home;
