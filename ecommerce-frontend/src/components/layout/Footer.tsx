import { Link } from "react-router";
import { usePreferences } from "../../context/preferences";
import { WORLDS, worldName } from "../../lib/worlds";
import Logo from "../Logo";

export default function Footer() {
    const { t } = usePreferences();

    return (
        <footer className="site-footer">
            <div className="container footer-grid">
                <div>
                    <Logo />
                    <p className="muted">{t("brand.tagline")}</p>
                </div>

                <div>
                    <h4>{t("footer.worlds")}</h4>
                    <ul>
                        {WORLDS.map((world) => (
                            <li key={world.key}><Link to={`/world/${world.key}`}>{t(worldName(world.key))}</Link></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4>{t("footer.help")}</h4>
                    <ul>
                        <li><Link to="/account">{t("footer.track")}</Link></li>
                        <li><Link to="/info/returns">{t("footer.returns")}</Link></li>
                        <li><Link to="/info/payment">{t("footer.payment")}</Link></li>
                        <li><Link to="/info/contact">{t("footer.contact")}</Link></li>
                    </ul>
                </div>

                <div>
                    <h4>{t("footer.about")}</h4>
                    <ul>
                        <li><Link to="/info/about">{t("footer.aboutUs")}</Link></li>
                        <li><Link to="/info/terms">{t("footer.terms")}</Link></li>
                        <li><Link to="/info/privacy">{t("footer.privacy")}</Link></li>
                    </ul>
                </div>
            </div>

            <p className="container footer-rights">{t("footer.rights", { year: new Date().getFullYear() })}</p>
        </footer>
    );
}
