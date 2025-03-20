import App from "../../App";
import RoundedBox from "../../components/UI/RoundedBox";
import goldDiagonal from "../../images/gold-diagnal.png";
import flourish from "../../images/flourish.svg";
import HoverCard from "../../components/UI/Cards/HoverCard";
import transparencyIcon from "../../images/transparency.svg";

const Home = () => {
    return (
        <App>
            <>
                {/* //TODO: add the ! to line below */}
                {import.meta.env.PROD ? (
                    <section className="display-flex flex-justify-center">
                        <RoundedBox className="margin-top-4 text-center">
                            <h1>This is a non-production OPS environment</h1>
                            <p>
                                ⚠️This environment is not authorized for certain production datasets. Additionally, this
                                environment may be updated regularly.
                            </p>
                        </RoundedBox>
                    </section>
                ) : (
                    <>
                        <section
                            id="hero"
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
                                OPS brings everyone together for transparent and collaborative budget planning and
                                tracking
                            </p>
                        </section>
                        <section
                            className="display-flex flex-column flex-align-center margin-bottom-4"
                            id="divider"
                        >
                            <h2 className="text-brand-primary font-32px">OPS Benefits</h2>
                            <img
                                src={flourish}
                                alt="flourish"
                                width="94px"
                            />
                        </section>
                        <section className="usa-card-group">
                            <HoverCard
                                title="Transparency"
                                description="Everyone can view everything and changes are tracked in the history so you can easily understand who changed what and when"
                                variant="dark"
                                icon={transparencyIcon}
                            />
                        </section>
                    </>
                )}
            </>
        </App>
    );
};

export default Home;
