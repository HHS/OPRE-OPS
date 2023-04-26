import { Footer } from "./components/UI/Footer/Footer";
import Header from "./components/UI/Header/Header";
import { loadPreFetchedData } from "./helpers/preFetchData";

function App(props) {
    // Prefetch some data
    loadPreFetchedData();

    return (
        <div className="bg-base-lightest">
            <div className="usa-overlay"></div>
            <Header />
            <main id="main-content" className="grid-container bg-white padding-bottom-6">
                {props.children}
            </main>
            <Footer />
        </div>
    );
}

export default App;
