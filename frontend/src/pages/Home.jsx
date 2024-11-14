import App from "../App";
import RoundedBox from "../components/UI/RoundedBox";

const Home = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                <RoundedBox className="margin-top-4 display-inline-block text-center">
                    <h1>This is the OPRE OPS system prototype</h1>
                    <p>⚠️Tread with caution</p>
                </RoundedBox>
            </div>
        </App>
    );
};

export default Home;
