import { Outlet } from "react-router-dom";
import App from "../../App";
import Tabs from "../../components/UI/Tabs";
import goldDiagonal from "../../images/gold-diagnal.png";

const Home = () => {
    return (
        <App>
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
                    className="margin-0 margin-top-4 margin-x-auto"
                    style={{ width: "612px", fontSize: "1.375rem" }}
                >
                    OPS brings everyone together for transparent and collaborative budget planning and tracking
                </p>
            </section>
            <Tabs
                paths={[
                    {
                        pathName: "/",
                        label: "About OPS"
                    },
                    {
                        pathName: "/release-notes",
                        label: "Release Notes"
                    },
                    {
                        pathName: "/next",
                        label: "What's Next"
                    }
                ]}
            />
            <Outlet />
        </App>
    );
};

export default Home;
