import App from "../../App";
import RoundedBox from "../../components/UI/RoundedBox";
import goldDiagonal from "../../images/gold-diagnal.png";

const Home = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                {/* //TODO: add the ! to line below */}
                {import.meta.env.PROD ? (
                    <RoundedBox className="margin-top-4 text-center">
                        <h1>This is a non-production OPS environment</h1>
                        <p>
                            ⚠️This environment is not authorized for certain production datasets. Additionally, this
                            environment may be updated regularly.
                        </p>
                    </RoundedBox>
                ) : (
                    <div
                        className="text-center bg-base-light padding-x-4 padding-y-6"
                        style={{
                            marginLeft: "calc(-2rem)",
                            marginRight: "calc(-2rem)",
                            width: "calc(100% + 4rem)",
                            backgroundImage: `url(${goldDiagonal})`,
                            backgroundRepeat: "repeat",
                            backgroundSize: "8px"
                        }}
                    >
                        <h1
                            className="margin-0 text-brand-primary"
                            style={{ fontSize: "4rem" }}
                        >
                            Plan, track & collaborate
                        </h1>
                        <p
                            className="text-brand-primary margin-0 margin-top-1"
                            style={{ fontSize: "2rem" }}
                        >
                            all in one place
                        </p>
                        <p
                            className="margin-top-4 margin-x-auto"
                            style={{ width: "612px", fontSize: "1.375rem" }}
                        >
                            OPS brings everyone together for transparent and collaborative budget planning and tracking
                        </p>
                    </div>
                )}
            </div>
        </App>
    );
};

export default Home;
