import { Footer } from "./components/UI/Footer/Footer";
import Header from "./components/UI/Header/Header";

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
