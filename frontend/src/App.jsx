import { Footer } from "./components/Footer/Footer";
import Header from "./components/Header/Header";

function App() {
    return (
        <>
            <div className="usa-overlay"></div>
            <Header />
            <main id="main-content">
                <h1>This is the OPRE OPS system prototype.</h1>
            </main>
            <Footer />
        </>
    );
}

export default App;
