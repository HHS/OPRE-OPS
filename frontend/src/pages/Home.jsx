import App from "../App";
import RoundedBox from "../components/UI/RoundedBox";

const Home = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                {!import.meta.env.PROD ? (
                    <RoundedBox className="margin-top-4 text-center">
                        <h1>This is a non-production OPS environment</h1>
                        <p>
                            ⚠️This environment is not authorized for certain production datasets. Additionally, this
                            environment may be updated regularly.
                        </p>
                    </RoundedBox>
                ) : (
                    <RoundedBox className="margin-top-4 text-center">
                        <h1>Welcome to OPS!</h1>
                    </RoundedBox>
                )}
            </div>
        </App>
    );
};

export default Home;
