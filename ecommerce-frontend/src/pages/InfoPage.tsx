import { NavLink, useParams } from "react-router";
import Icon from "../components/icons";
import { NotFound } from "../components/StateViews";
import { STORE, whatsappUrl } from "../config/store";
import { infoPage, INFO_SLUGS, isInfoSlug } from "../content/info";
import { usePreferences } from "../context/preferences";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function InfoPage() {
    const { slug } = useParams();
    const { lang } = usePreferences();
    const page = isInfoSlug(slug) ? infoPage(slug, lang) : null;
    useDocumentTitle(page?.title, page?.intro);

    if (!isInfoSlug(slug) || !page) {
        return <NotFound />;
    }

    return (
        <section className="container section info-layout">
            <nav className="info-nav" aria-label={lang === "ar" ? "صفحات المعلومات" : "Information pages"}>
                {INFO_SLUGS.map((entry) => (
                    <NavLink key={entry} to={`/info/${entry}`}>{infoPage(entry, lang).title}</NavLink>
                ))}
            </nav>

            <article className="info-page">
                <h1 className="section-title">{page.title}</h1>
                <p className="lead">{page.intro}</p>

                {slug === "contact" && <ContactCards />}

                {page.blocks.map((block) => (
                    <section key={block.heading} className="info-page__block">
                        <h2>{block.heading}</h2>
                        {block.paragraphs?.map((paragraph) => <p key={paragraph} dir="auto">{paragraph}</p>)}
                        {block.list && <ul>{block.list.map((item) => <li key={item} dir="auto">{item}</li>)}</ul>}
                    </section>
                ))}
            </article>
        </section>
    );
}

function ContactCards() {
    const { lang } = usePreferences();
    const labels = lang === "ar"
        ? { phone: "الهاتف", whatsapp: "واتساب", email: "البريد الإلكتروني", hours: "أوقات العمل", address: "العنوان" }
        : { phone: "Phone", whatsapp: "WhatsApp", email: "Email", hours: "Opening hours", address: "Address" };

    return (
        <div className="contact-cards">
            <a className="contact-card" href={`tel:${STORE.phone.replace(/\s+/g, "")}`}>
                <Icon name="phone" size={22} />
                <span><strong>{labels.phone}</strong><span dir="ltr">{STORE.phone}</span></span>
            </a>
            {whatsappUrl && (
                <a className="contact-card" href={whatsappUrl} target="_blank" rel="noreferrer">
                    <Icon name="headset" size={22} />
                    <span><strong>{labels.whatsapp}</strong><span dir="ltr">+{STORE.whatsapp}</span></span>
                </a>
            )}
            <a className="contact-card" href={`mailto:${STORE.email}`}>
                <Icon name="bell" size={22} />
                <span><strong>{labels.email}</strong><span dir="ltr">{STORE.email}</span></span>
            </a>
            <div className="contact-card">
                <Icon name="clock" size={22} />
                <span><strong>{labels.hours}</strong><span>{STORE.supportHours[lang]}</span></span>
            </div>
            <div className="contact-card">
                <Icon name="home" size={22} />
                <span><strong>{labels.address}</strong><span>{STORE.address[lang]}</span></span>
            </div>
        </div>
    );
}
