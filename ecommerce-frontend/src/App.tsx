import { useEffect } from "react";
import { getProducts } from "./services/productService";
i

function App() {
    useEffect(() => {
        async function testProducts() {
            try {
                const data = await getProducts();
                console.log("Products:", data);
            } catch (error) {
                console.error("API Error:", error);
            }
        }

        testProducts();
    }, []);

    return <h1>Testing Product Service...</h1>;
}

export default App;