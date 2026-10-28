import { Link } from "react-router";
import { usePreferences } from "../../context/preferences";
import type { Product } from "../../types/api";
import Icon from "../icons";
import { STORE } from "../../config/store";

export function TechHero({ count }: { count: number }) {
    const { t } = usePreferences();

    return (
        <section className="world-hero tech-hero">
            <div className="tech-hero__text">
                <p className="mono kicker">{t("tech.hero.kicker")}</p>
                <h1 className="display">
                    {t("tech.hero.title")} <span className="accent-text">{t("tech.hero.accent")}</span>
                </h1>
                <p className="lead">{t("tech.hero.text")}</p>
                <div className="tech-stats">
                    <div><strong className="mono">{count}</strong><span>{t("listing.results", { count: "" }).trim()}</span></div>
                    <div><strong className="mono">{STORE.deliveryHours.max}h</strong><span>{t("tech.stat.delivery")}</span></div>
                    <div><strong className="mono">{STORE.warrantyMonths}m</strong><span>{t("tech.stat.warranty")}</span></div>
                </div>
            </div>
            <div className="tech-hero__art" aria-hidden="true">
                <div className="tech-phone">
                    <span className="tech-phone__ring" />
                    <span className="tech-phone__bar" />
                </div>
                <span className="tech-tag tech-tag--a mono">OLED · 120Hz</span>
                <span className="tech-tag tech-tag--b mono">256GB · 5G</span>
                <span className="tech-tag tech-tag--c mono">5000mAh · 65W</span>
            </div>
        </section>
    );
}

export function FashionHero() {
    const { t } = usePreferences();

    return (
        <section className="world-hero fashion-hero">
            <div className="fashion-hero__art" aria-hidden="true">
                <span className="fashion-hero__num" data-num="26" aria-hidden="true" />
                <svg viewBox="0 0 120 260" className="fashion-hero__figure">
                    <circle cx="60" cy="28" r="18" />
                    <path d="M42 52h36l8 50-14 6 18 152H30l18-152-14-6z M48 108h24 M44 160h32" />
                </svg>
            </div>
            <div className="fashion-hero__text">
                <p className="latin kicker">{t("fashion.hero.kicker")}</p>
                <h1 className="display">
                    {t("fashion.hero.title")}
                    <span className="accent-text">{t("fashion.hero.accent")}</span>
                </h1>
                <p className="lead">{t("fashion.hero.text")}</p>
            </div>
        </section>
    );
}

export function FoodHero() {
    const { t } = usePreferences();

    return (
        <section className="world-hero food-hero">
            <div className="food-hero__text">
                <span className="badge badge--accent">{t("food.hero.badge")}</span>
                <h1 className="display">{t("food.hero.title")}</h1>
                <p className="lead">{t("food.hero.text")}</p>
                {STORE.foodSameDay && <p className="food-hero__delivery"><Icon name="clock" size={16} /> {t("food.delivery", STORE.foodSameDay)}</p>}
            </div>
            <div className="food-hero__art" aria-hidden="true">
                <span className="food-dot food-dot--tomato" />
                <span className="food-dot food-dot--lemon" />
            </div>
        </section>
    );
}

export function BooksHero({ books }: { books: Product[] }) {
    const { t } = usePreferences();

    return (
        <section className="world-hero books-hero">
            <div className="books-hero__text">
                <p className="books-hero__quote">{t("books.hero.quote")}</p>
                <h1 className="display">{t("books.hero.title")}</h1>
                <p className="lead">{t("books.hero.text")}</p>
            </div>
            <div className="shelf" aria-hidden="true">
                <div className="shelf__books">
                    {books.slice(0, 9).map((book, index) => (
                        <Link
                            key={book.id}
                            to={`/product/${book.id}`}
                            tabIndex={-1}
                            className={`spine spine--${index % 4}`}
                            style={{ height: `${150 + ((index * 37) % 70)}px` }}
                        >
                            <span>{book.name}</span>
                        </Link>
                    ))}
                </div>
                <div className="shelf__board" />
            </div>
        </section>
    );
}
