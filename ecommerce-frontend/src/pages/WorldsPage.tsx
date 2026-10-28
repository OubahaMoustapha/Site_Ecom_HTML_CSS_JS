import WorldTiles from "../components/WorldTiles";
import { usePreferences } from "../context/preferences";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function WorldsPage() {
    const { t } = usePreferences();
    useDocumentTitle(t("nav.worlds"));

    return (
        <section className="container section">
            <h1 className="section-title">{t("nav.allWorlds")}</h1>
            <WorldTiles />
        </section>
    );
}
