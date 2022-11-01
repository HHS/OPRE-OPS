import { Footer } from "./components/Footer/Footer";
import Header from "./components/Header/Header";

function App(props) {
    return (
        <>
            <div className="usa-overlay"></div>
            <Header />
            <main id="main-content">
                <section className="grid-container usa-section">{props.children}</section>
            </main>
            <Footer />
        </>
    );
}

export default App;
