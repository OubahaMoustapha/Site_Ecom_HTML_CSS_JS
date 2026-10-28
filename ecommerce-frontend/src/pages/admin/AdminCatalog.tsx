import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import CategoryOptions from "../../components/CategoryOptions";
import ConfirmButton from "../../components/admin/ConfirmButton";
import Field, { CheckField, SelectField } from "../../components/Field";
import Icon from "../../components/icons";
import { Async, Empty } from "../../components/StateViews";
import { usePreferences } from "../../context/preferences";
import { useToast } from "../../context/toast";
import { useWorlds } from "../../context/worlds";
import { useAsync } from "../../hooks/useAsync";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { isWorldCategory } from "../../lib/catalog";
import { errorMessage, fieldErrors } from "../../lib/errors";
import { invalidateCategories, loadCategories, WORLDS, worldName } from "../../lib/worlds";
import {
    createAttribute,
    createAttributeValue,
    createBrand,
    createCategory,
    deleteAttribute,
    deleteAttributeValue,
    deleteBrand,
    deleteCategory,
    getAllAttributes,
    getAllAttributeValues,
    getAllBrands,
    slugify,
    updateAttribute,
    updateBrand,
    updateCategory,
} from "../../services/catalogService";
import type { Attribute, AttributeValue, Brand, Category } from "../../types/api";

type Tab = "categories" | "brands" | "attributes";
const TABS: Tab[] = ["categories", "brands", "attributes"];

export default function AdminCatalog() {
    const { t } = usePreferences();
    const [params, setParams] = useSearchParams();
    const tab = TABS.find((value) => value === params.get("tab")) ?? "categories";
    useDocumentTitle(t(`admin.${tab}`));

    return (
        <div className="admin-page">
            <div className="admin-page__head">
                <h1 className="admin-page__title">{t("admin.catalog")}</h1>
            </div>

            <div className="tabs" role="tablist" aria-label={t("admin.catalog")}>
                {TABS.map((value) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        className={`tab${tab === value ? " tab--active" : ""}`}
                        onClick={() => setParams({ tab: value })}
                    >
                        {t(`admin.${value}`)}
                    </button>
                ))}
            </div>

            {tab === "categories" && <CategoriesTab />}
            {tab === "brands" && <BrandsTab />}
            {tab === "attributes" && <AttributesTab />}
        </div>
    );
}

/** Shared state for "edit this item / create a new one" side forms. */
function useSaver(onDone: () => void) {
    const { t } = usePreferences();
    const { notify } = useToast();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);

    const run = async (action: () => Promise<unknown>, message = t("admin.saved")) => {
        setBusy(true);
        setErrors({});
        try {
            await action();
            notify(message);
            onDone();
            return true;
        } catch (error) {
            setErrors(fieldErrors(error));
            notify(errorMessage(error, t("common.error")), "error");
            return false;
        } finally {
            setBusy(false);
        }
    };

    return { errors, busy, run };
}

/* ---------------------------------------------------------------- Categories */

async function freshCategories() {
    invalidateCategories();
    return loadCategories();
}

function CategoriesTab() {
    const worlds = useWorlds();
    const result = useAsync(freshCategories);
    const [editing, setEditing] = useState<Category | null>(null);

    // The storefront caches categories too: refresh it after every change.
    const changed = () => {
        setEditing(null);
        result.reload();
        worlds.reload();
    };

    return (
        <div className="admin-grid">
            <Async {...result}>
                {(categories) => (
                    <section className="panel admin-card">
                        <CategoryTree categories={categories} onEdit={setEditing} onChanged={changed} />
                    </section>
                )}
            </Async>
            {result.data && (
                <CategoryForm key={editing?.id ?? "new"} category={editing} categories={result.data} onCancel={() => setEditing(null)} onSaved={changed} />
            )}
        </div>
    );
}

function CategoryTree({ categories, onEdit, onChanged }: { categories: Category[]; onEdit: (category: Category) => void; onChanged: () => void }) {
    const { t } = usePreferences();
    const { notify } = useToast();
    const parents = categories
        .filter((category) => category.parent_id === null)
        .sort((a, b) => Number(isWorldCategory(b)) - Number(isWorldCategory(a)));

    const remove = async (category: Category) => {
        try {
            await deleteCategory(category.id);
            notify(t("admin.deleted"));
            onChanged();
        } catch (error) {
            notify(errorMessage(error, t("common.error")), "error");
        }
    };

    const row = (category: Category, child = false) => {
        const world = WORLDS.find((entry) => entry.slug === category.slug);
        return (
            <li key={category.id} className={`tree__row${child ? " tree__row--child" : ""}${category.is_active ? "" : " is-muted"}`}>
                <span className="tree__name">
                    {world && <span className="dot" data-world-dot={world.key} />}
                    <strong>{world ? t(worldName(world.key)) : category.name}</strong>
                    {world && <span className="badge">{t("admin.category.world")}</span>}
                    {!category.is_active && <span className="badge status--cancelled">{t("admin.status.inactive")}</span>}
                    <small className="muted mono">{category.slug}</small>
                </span>
                <span className="row-actions">
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => onEdit(category)}>{t("admin.edit")}</button>
                    {isWorldCategory(category)
                        ? <span className="muted small" title={t("admin.category.protected")}><Icon name="lock" size={14} /></span>
                        : <ConfirmButton question={t("admin.category.deleteConfirm")} onConfirm={() => remove(category)}>{t("admin.delete")}</ConfirmButton>}
                </span>
            </li>
        );
    };

    if (categories.length === 0) return <Empty icon="list" title={t("admin.empty")} />;

    return (
        <ul className="tree">
            {parents.map((parent) => (
                <li key={parent.id}>
                    <ul>
                        {row(parent)}
                        {categories.filter((category) => category.parent_id === parent.id).map((child) => row(child, true))}
                    </ul>
                </li>
            ))}
        </ul>
    );
}

function CategoryForm({ category, categories, onCancel, onSaved }: {
    category: Category | null;
    categories: Category[];
    onCancel: () => void;
    onSaved: () => void;
}) {
    const { t } = usePreferences();
    const { errors, busy, run } = useSaver(onSaved);
    const [name, setName] = useState(category?.name ?? "");
    const [slug, setSlug] = useState(category?.slug ?? "");
    const [slugTouched, setSlugTouched] = useState(Boolean(category));
    const [description, setDescription] = useState(category?.description ?? "");
    const [parentId, setParentId] = useState<number | null>(category?.parent_id ?? null);
    const [active, setActive] = useState(category?.is_active ?? true);
    const world = category ? isWorldCategory(category) : false;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const payload = { name, slug, description: description || null, parent_id: parentId, is_active: active };
        void run(() => (category ? updateCategory(category.id, payload) : createCategory(payload)));
    };

    return (
        <form className="panel stack admin-card" onSubmit={submit} noValidate>
            <h2 className="panel__title">{category ? t("admin.category.edit") : t("admin.category.new")}</h2>
            <Field label={t("admin.field.name")} value={name} onChange={(event) => { setName(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} error={errors.name} required />
            <Field
                label={t("admin.field.slug")}
                value={slug}
                onChange={(event) => { setSlugTouched(true); setSlug(event.target.value); }}
                error={errors.slug}
                hint={world ? t("admin.category.protected") : t("admin.field.slug.hint")}
                disabled={world}
                dir="ltr"
                required
            />
            {!world && (
                <SelectField label={t("admin.category.parent")} value={parentId ?? ""} onChange={(value) => setParentId(value ? Number(value) : null)} error={errors.parent_id} hint={t("admin.category.worldHint")}>
                    <option value="">{t("admin.category.parentNone")}</option>
                    <CategoryOptions categories={categories.filter((entry) => entry.parent_id === null)} exclude={category?.id} />
                </SelectField>
            )}
            <Field label={t("admin.field.description")} value={description} onChange={(event) => setDescription(event.target.value)} error={errors.description} multiline />
            <CheckField label={t("admin.field.active")} checked={active} onChange={setActive} />
            <div className="row-actions">
                <button type="submit" className="btn btn--primary" disabled={busy} aria-busy={busy}>{busy ? t("admin.saving") : t("admin.save")}</button>
                {category && <button type="button" className="btn btn--ghost" onClick={onCancel}>{t("common.cancel")}</button>}
            </div>
        </form>
    );
}

/* ---------------------------------------------------------------- Brands */

function BrandsTab() {
    const { t } = usePreferences();
    const { notify } = useToast();
    const result = useAsync(getAllBrands);
    const [editing, setEditing] = useState<Brand | null>(null);

    const changed = () => {
        setEditing(null);
        result.reload();
    };

    const remove = async (brand: Brand) => {
        try {
            await deleteBrand(brand.id);
            notify(t("admin.deleted"));
            changed();
        } catch (error) {
            notify(errorMessage(error, t("common.error")), "error");
        }
    };

    return (
        <div className="admin-grid">
            <Async {...result}>
                {(brands) => brands.length === 0 ? <Empty icon="list" title={t("admin.empty")} /> : (
                    <section className="panel admin-card">
                        <div className="table-wrap">
                            <table className="table table--compact">
                                <thead><tr><th>{t("admin.field.name")}</th><th>{t("admin.field.website")}</th><th>{t("order.status")}</th><th>{t("admin.actions")}</th></tr></thead>
                                <tbody>
                                    {brands.map((brand) => (
                                        <tr key={brand.id} className={brand.is_active ? undefined : "is-muted"}>
                                            <td><strong>{brand.name}</strong><small className="muted mono">{brand.slug}</small></td>
                                            <td>{brand.website ? <a href={brand.website} target="_blank" rel="noreferrer" dir="ltr">{brand.website.replace(/^https?:\/\//, "")}</a> : <span className="muted">—</span>}</td>
                                            <td><span className={`badge ${brand.is_active ? "status--completed" : "status--cancelled"}`}>{t(brand.is_active ? "admin.status.active" : "admin.status.inactive")}</span></td>
                                            <td>
                                                <div className="row-actions">
                                                    <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(brand)}>{t("admin.edit")}</button>
                                                    <ConfirmButton question={t("admin.brand.deleteConfirm")} onConfirm={() => remove(brand)}>{t("admin.delete")}</ConfirmButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </Async>
            <BrandForm key={editing?.id ?? "new"} brand={editing} onCancel={() => setEditing(null)} onSaved={changed} />
        </div>
    );
}

function BrandForm({ brand, onCancel, onSaved }: { brand: Brand | null; onCancel: () => void; onSaved: () => void }) {
    const { t } = usePreferences();
    const { errors, busy, run } = useSaver(onSaved);
    const [name, setName] = useState(brand?.name ?? "");
    const [slug, setSlug] = useState(brand?.slug ?? "");
    const [slugTouched, setSlugTouched] = useState(Boolean(brand));
    const [website, setWebsite] = useState(brand?.website ?? "");
    const [description, setDescription] = useState(brand?.description ?? "");
    const [active, setActive] = useState(brand?.is_active ?? true);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const payload = { name, slug, website: website.trim() || null, description: description || null, is_active: active };
        void run(() => (brand ? updateBrand(brand.id, payload) : createBrand(payload)));
    };

    return (
        <form className="panel stack admin-card" onSubmit={submit} noValidate>
            <h2 className="panel__title">{brand ? t("admin.brand.edit") : t("admin.brand.new")}</h2>
            <Field label={t("admin.field.name")} value={name} onChange={(event) => { setName(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} error={errors.name} required />
            <Field label={t("admin.field.slug")} value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value); }} error={errors.slug} hint={t("admin.field.slug.hint")} dir="ltr" required />
            <Field label={t("admin.field.website")} type="url" value={website} onChange={(event) => setWebsite(event.target.value)} error={errors.website} placeholder="https://" dir="ltr" />
            <Field label={t("admin.field.description")} value={description} onChange={(event) => setDescription(event.target.value)} error={errors.description} multiline />
            <CheckField label={t("admin.field.active")} checked={active} onChange={setActive} />
            <div className="row-actions">
                <button type="submit" className="btn btn--primary" disabled={busy} aria-busy={busy}>{busy ? t("admin.saving") : t("admin.save")}</button>
                {brand && <button type="button" className="btn btn--ghost" onClick={onCancel}>{t("common.cancel")}</button>}
            </div>
        </form>
    );
}

/* ---------------------------------------------------------------- Attributes */

async function loadAttributes() {
    const [attributes, values] = await Promise.all([getAllAttributes(), getAllAttributeValues()]);
    return { attributes, values };
}

function AttributesTab() {
    const { t } = usePreferences();
    const result = useAsync(loadAttributes);
    const [editing, setEditing] = useState<Attribute | null>(null);

    const changed = () => {
        setEditing(null);
        result.reload();
    };

    return (
        <div className="admin-grid">
            <Async {...result}>
                {({ attributes, values }) => (
                    <section className="panel admin-card stack">
                        <p className="muted small">{t("admin.attribute.hint")}</p>
                        {attributes.length === 0 ? <Empty icon="list" title={t("admin.empty")} /> : attributes.map((attribute) => (
                            <AttributeCard
                                key={attribute.id}
                                attribute={attribute}
                                values={values.filter((value) => value.attribute_id === attribute.id)}
                                onEdit={() => setEditing(attribute)}
                                onChanged={changed}
                            />
                        ))}
                    </section>
                )}
            </Async>
            <AttributeForm key={editing?.id ?? "new"} attribute={editing} onCancel={() => setEditing(null)} onSaved={changed} />
        </div>
    );
}

function AttributeCard({ attribute, values, onEdit, onChanged }: { attribute: Attribute; values: AttributeValue[]; onEdit: () => void; onChanged: () => void }) {
    const { t } = usePreferences();
    const { notify } = useToast();
    const { busy, run } = useSaver(onChanged);
    const [value, setValue] = useState("");

    const add = async (event: FormEvent) => {
        event.preventDefault();
        if (!value.trim()) return;
        if (await run(() => createAttributeValue(attribute.id, value.trim()))) setValue("");
    };

    const remove = async (action: () => Promise<unknown>) => {
        try {
            await action();
            notify(t("admin.deleted"));
            onChanged();
        } catch (error) {
            notify(errorMessage(error, t("common.error")), "error");
        }
    };

    return (
        <article className={`attribute-card${attribute.is_active ? "" : " is-muted"}`}>
            <header className="attribute-card__head">
                <strong>{attribute.name}</strong>
                <small className="muted mono">{attribute.slug}</small>
                <span className="row-actions">
                    <button type="button" className="btn btn--outline btn--sm" onClick={onEdit}>{t("admin.edit")}</button>
                    <ConfirmButton question={t("admin.attribute.deleteConfirm")} onConfirm={() => remove(() => deleteAttribute(attribute.id))}>{t("admin.delete")}</ConfirmButton>
                </span>
            </header>
            <ul className="value-chips" aria-label={t("admin.attribute.values")}>
                {values.map((entry) => (
                    <li key={entry.id} className="value-chip">
                        <span>{entry.value}</span>
                        <ConfirmButton question={t("admin.attribute.valueDeleteConfirm")} onConfirm={() => remove(() => deleteAttributeValue(entry.id))} className="value-chip__delete">
                            <Icon name="close" size={12} />
                            <span className="sr-only">{t("admin.delete")} {entry.value}</span>
                        </ConfirmButton>
                    </li>
                ))}
            </ul>
            <form className="inline-form" onSubmit={add}>
                <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={t("admin.attribute.valuePlaceholder")} aria-label={`${t("admin.attribute.values")}: ${attribute.name}`} maxLength={255} />
                <button type="submit" className="btn btn--outline btn--sm" disabled={busy || !value.trim()}>{t("admin.add")}</button>
            </form>
        </article>
    );
}

function AttributeForm({ attribute, onCancel, onSaved }: { attribute: Attribute | null; onCancel: () => void; onSaved: () => void }) {
    const { t } = usePreferences();
    const { errors, busy, run } = useSaver(onSaved);
    const [name, setName] = useState(attribute?.name ?? "");
    const [slug, setSlug] = useState(attribute?.slug ?? "");
    const [slugTouched, setSlugTouched] = useState(Boolean(attribute));
    const [active, setActive] = useState(attribute?.is_active ?? true);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const payload = { name, slug, description: attribute?.description ?? null, is_active: active };
        void run(() => (attribute ? updateAttribute(attribute.id, payload) : createAttribute(payload)));
    };

    return (
        <form className="panel stack admin-card" onSubmit={submit} noValidate>
            <h2 className="panel__title">{attribute ? t("admin.attribute.edit") : t("admin.attribute.new")}</h2>
            <Field label={t("admin.field.name")} value={name} onChange={(event) => { setName(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} error={errors.name} required />
            <Field label={t("admin.field.slug")} value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value); }} error={errors.slug} hint={t("admin.field.slug.hint")} dir="ltr" required />
            <CheckField label={t("admin.field.active")} checked={active} onChange={setActive} />
            <div className="row-actions">
                <button type="submit" className="btn btn--primary" disabled={busy} aria-busy={busy}>{busy ? t("admin.saving") : t("admin.save")}</button>
                {attribute && <button type="button" className="btn btn--ghost" onClick={onCancel}>{t("common.cancel")}</button>}
            </div>
        </form>
    );
}
