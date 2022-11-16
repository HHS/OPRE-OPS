import { Footer } from "./components/Footer/Footer";
import Header from "./components/Header/Header";

function App(props) {
    return (
        <>
            <div className="usa-overlay"></div>
            <Header />
            <main id="main-content">{props.children}</main>
            <Footer />
        </>
    );
}

export default App;
