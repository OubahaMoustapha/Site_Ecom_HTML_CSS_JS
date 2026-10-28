import { useCallback, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import CategoryOptions from "../../components/CategoryOptions";
import ConfirmButton from "../../components/admin/ConfirmButton";
import Field, { CheckField, SelectField } from "../../components/Field";
import Icon from "../../components/icons";
import { ErrorView, Loading } from "../../components/StateViews";
import { usePreferences } from "../../context/preferences";
import { useToast } from "../../context/toast";
import { useAsync } from "../../hooks/useAsync";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { payloadOf } from "../../lib/catalog";
import { errorMessage, fieldErrors } from "../../lib/errors";
import { purchasable } from "../../lib/variants";
import { loadCategories } from "../../lib/worlds";
import { createStockMovement } from "../../services/adminService";
import { ApiRequestError } from "../../services/apiClient";
import {
    createInventory,
    createProduct,
    createVariant,
    deleteProductImage,
    deleteVariant,
    getAllAttributeValues,
    getAllBrands,
    slugify,
    updateProduct,
    updateVariant,
    uploadProductImage,
    type ProductPayload,
} from "../../services/catalogService";
import { getProduct } from "../../services/productService";
import type { AttributeValue, Brand, Category, Product, ProductVariant } from "../../types/api";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const LOW_STOCK_THRESHOLD = 5;

interface Lookups {
    categories: Category[];
    brands: Brand[];
    values: AttributeValue[];
}

async function loadLookups(): Promise<Lookups> {
    const [categories, brands, values] = await Promise.all([loadCategories(), getAllBrands(), getAllAttributeValues()]);
    return { categories, brands, values };
}

export default function AdminProductEditor() {
    const { id } = useParams();
    const { t } = usePreferences();
    const isNew = id === "new";

    const lookups = useAsync(loadLookups);
    const product = useAsync(useCallback(() => (isNew ? Promise.resolve(null) : getProduct(id ?? "")), [id, isNew]));

    useDocumentTitle(isNew ? t("admin.product.new") : product.data?.name ?? t("admin.product.edit"));

    if (lookups.error || product.error) {
        return <ErrorView error={lookups.error ?? product.error} onRetry={() => { lookups.reload(); product.reload(); }} />;
    }

    if (!lookups.data || product.data === undefined) {
        return <Loading />;
    }

    return (
        <div className="admin-page">
            <div className="admin-page__head">
                <div>
                    <Link to="/admin/products" className="link-arrow link-arrow--back">
                        <Icon name="arrow" size={16} className="flip-rtl rotate" /> {t("admin.products")}
                    </Link>
                    <h1 className="admin-page__title">{isNew ? t("admin.product.new") : product.data?.name}</h1>
                </div>
                {product.data && (
                    <a href={`/product/${product.data.id}`} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">
                        {t("admin.product.view")}
                    </a>
                )}
            </div>

            <div className="editor-grid">
                <DetailsForm key={product.data?.id ?? "new"} product={product.data} lookups={lookups.data} onSaved={product.reload} />

                {product.data ? (
                    <>
                        <ImagesPanel product={product.data} onChanged={product.reload} />
                        <VariantsPanel product={product.data} values={lookups.data.values} onChanged={product.reload} />
                    </>
                ) : (
                    <p className="note"><Icon name="alert" size={16} /> {t("admin.product.saveFirst")}</p>
                )}
            </div>
        </div>
    );
}

/* ---------------------------------------------------------------- Details */

function DetailsForm({ product, lookups, onSaved }: { product: Product | null; lookups: Lookups; onSaved: () => void }) {
    const { t } = usePreferences();
    const { notify } = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState<ProductPayload>(() => product ? payloadOf(product) : {
        name: "", slug: "", description: null, price: 0, stock: 0, is_active: true,
        category_id: null, brand_id: null, meta_title: null, meta_description: null,
    });
    // The slug follows the name until it is edited by hand (new products only).
    const [slugTouched, setSlugTouched] = useState(Boolean(product));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);

    const set = <K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) =>
        setForm((current) => ({ ...current, [key]: value }));

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setErrors({});

        // "stock" is a legacy product column: keep it equal to the variants' total.
        const stock = (product?.variants ?? []).reduce((sum, variant) => sum + (variant.stock ?? 0), 0);
        const payload = { ...form, stock, description: form.description || null, meta_title: form.meta_title || null, meta_description: form.meta_description || null };

        try {
            if (product) {
                await updateProduct(product.id, payload);
                notify(t("admin.saved"));
                onSaved();
            } else {
                const created = await createProduct(payload);
                notify(t("admin.product.created"));
                navigate(`/admin/products/${created.id}`, { replace: true });
            }
        } catch (error) {
            setErrors(fieldErrors(error));
            notify(errorMessage(error, t("common.error")), "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="panel stack" onSubmit={submit} noValidate>
            <h2 className="panel__title">{t("admin.product.details")}</h2>

            <div className="form-grid">
                <Field
                    label={t("admin.field.name")}
                    value={form.name}
                    onChange={(event) => {
                        const name = event.target.value;
                        setForm((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) }));
                    }}
                    error={errors.name}
                    required
                />
                <Field
                    label={t("admin.field.slug")}
                    value={form.slug}
                    onChange={(event) => { setSlugTouched(true); set("slug", event.target.value); }}
                    error={errors.slug}
                    hint={t("admin.field.slug.hint")}
                    dir="ltr"
                    required
                />
                <SelectField label={t("admin.product.category")} value={form.category_id ?? ""} onChange={(value) => set("category_id", value ? Number(value) : null)} error={errors.category_id}>
                    <option value="">{t("admin.none")}</option>
                    <CategoryOptions categories={lookups.categories} />
                </SelectField>
                <SelectField label={t("admin.product.brand")} value={form.brand_id ?? ""} onChange={(value) => set("brand_id", value ? Number(value) : null)} error={errors.brand_id}>
                    <option value="">{t("admin.none")}</option>
                    {lookups.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </SelectField>
                <Field
                    label={t("admin.product.price")}
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(event) => set("price", Number(event.target.value))}
                    error={errors.price}
                    hint={t("admin.product.price.hint")}
                    dir="ltr"
                    required
                />
            </div>

            <Field label={t("admin.field.description")} value={form.description ?? ""} onChange={(event) => set("description", event.target.value)} error={errors.description} multiline />
            <CheckField label={t("admin.field.active")} hint={t("admin.field.active.hint")} checked={form.is_active} onChange={(value) => set("is_active", value)} />

            <details className="editor-seo">
                <summary>{t("admin.product.seo")}</summary>
                <Field label={t("admin.product.metaTitle")} value={form.meta_title ?? ""} onChange={(event) => set("meta_title", event.target.value)} error={errors.meta_title} maxLength={255} />
                <Field label={t("admin.product.metaDescription")} value={form.meta_description ?? ""} onChange={(event) => set("meta_description", event.target.value)} error={errors.meta_description} multiline />
            </details>

            <button type="submit" className="btn btn--primary" disabled={busy} aria-busy={busy}>
                {busy ? t("admin.saving") : t("admin.save")}
            </button>
        </form>
    );
}

/* ---------------------------------------------------------------- Variants */

/** Sets a variant's stock to `target` through the audited stock-movement log. */
async function setStock(variant: { id: number; stock?: number }, target: number, note: string) {
    const current = variant.stock ?? 0;

    if (target === current) {
        return;
    }

    try {
        if (target === 0) {
            await createStockMovement(variant.id, "out", current, note);
        } else {
            await createStockMovement(variant.id, "adjustment", target, note);
        }
    } catch (error) {
        // A variant created outside this page may have no stock record yet.
        if (error instanceof ApiRequestError && error.status === 422 && error.errors?.product_variant_id) {
            await createInventory(variant.id, target, LOW_STOCK_THRESHOLD);
            return;
        }
        throw error;
    }
}

function VariantsPanel({ product, values, onChanged }: { product: Product; values: AttributeValue[]; onChanged: () => void }) {
    const { t } = usePreferences();
    const variants = product.variants ?? [];
    const buyable = variants.some(purchasable);

    return (
        <section className="panel stack editor-wide">
            <h2 className="panel__title">{t("admin.variants")}</h2>
            <p className="muted small">{t("admin.variants.hint")}</p>
            {!buyable && <p className="note note--warn"><Icon name="alert" size={16} /> {t("admin.product.notBuyable")}</p>}

            <div className="variant-list">
                {variants.length === 0 && <p className="muted">{t("admin.variants.none")}</p>}
                {variants.map((variant) => <VariantRow key={variant.id} variant={variant} values={values} onChanged={onChanged} />)}
                <VariantRow key={`new-${variants.length}`} productId={product.id} defaultPrice={Number(product.price)} values={values} onChanged={onChanged} />
            </div>
        </section>
    );
}

interface VariantDraft {
    sku: string;
    price: string;
    stock: string;
    barcode: string;
    weight: string;
    is_active: boolean;
    attribute_values: number[];
}

function VariantRow({ variant, productId, defaultPrice, values, onChanged }: {
    variant?: ProductVariant;
    productId?: number;
    defaultPrice?: number;
    values: AttributeValue[];
    onChanged: () => void;
}) {
    const { t } = usePreferences();
    const { notify } = useToast();
    const isNew = !variant;

    const initial: VariantDraft = {
        sku: variant?.sku ?? "",
        price: String(variant?.price ?? defaultPrice ?? 0),
        stock: String(variant?.stock ?? 0),
        barcode: variant?.barcode ?? "",
        weight: variant?.weight == null ? "" : String(variant.weight),
        is_active: variant?.is_active ?? true,
        attribute_values: variant?.attribute_values?.map((value) => value.id) ?? [],
    };
    const [draft, setDraft] = useState(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

    const set = <K extends keyof VariantDraft>(key: K, value: VariantDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

    const save = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setErrors({});

        const payload = {
            sku: draft.sku.trim(),
            price: Number(draft.price),
            barcode: draft.barcode.trim() || null,
            weight: draft.weight === "" ? null : Number(draft.weight),
            is_active: draft.is_active,
            attribute_values: draft.attribute_values,
        };
        const stock = Math.max(0, Math.floor(Number(draft.stock) || 0));

        try {
            if (variant) {
                await updateVariant(variant.id, payload);
                await setStock(variant, stock, t("admin.variant.stockNote"));
                notify(t("admin.saved"));
            } else {
                const created = await createVariant({ ...payload, product_id: productId ?? 0 });
                await createInventory(created.id, stock, LOW_STOCK_THRESHOLD);
                notify(t("admin.variant.created"));
            }
            onChanged();
        } catch (error) {
            setErrors(fieldErrors(error));
            notify(errorMessage(error, t("common.error")), "error");
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!variant) return;
        try {
            await deleteVariant(variant.id);
            notify(t("admin.deleted"));
            onChanged();
        } catch (error) {
            const ordered = error instanceof ApiRequestError && error.status === 409;
            notify(ordered ? t("admin.variant.ordered") : errorMessage(error, t("common.error")), "error");
        }
    };

    return (
        <form className={`variant-row${isNew ? " variant-row--new" : ""}${draft.is_active ? "" : " is-muted"}`} onSubmit={save} noValidate>
            {isNew && <h3 className="variant-row__title"><Icon name="plus" size={16} /> {t("admin.variant.add")}</h3>}
            <div className="variant-row__fields">
                <Field label={t("admin.variant.sku")} value={draft.sku} onChange={(event) => set("sku", event.target.value)} error={errors.sku} dir="ltr" required />
                <Field label={t("admin.variant.price")} type="number" min={0} step="0.01" value={draft.price} onChange={(event) => set("price", event.target.value)} error={errors.price} dir="ltr" required />
                <Field label={t("admin.variant.stock")} type="number" min={0} step="1" value={draft.stock} onChange={(event) => set("stock", event.target.value)} error={errors.quantity} dir="ltr" />
                <Field label={t("admin.variant.barcode")} value={draft.barcode} onChange={(event) => set("barcode", event.target.value)} error={errors.barcode} dir="ltr" />
                <Field label={t("admin.variant.weight")} type="number" min={0} step="0.01" value={draft.weight} onChange={(event) => set("weight", event.target.value)} error={errors.weight} dir="ltr" />
            </div>

            <AttributePicker values={values} selected={draft.attribute_values} onChange={(ids) => set("attribute_values", ids)} />

            <div className="variant-row__foot">
                <CheckField label={t("admin.variant.active")} checked={draft.is_active} onChange={(value) => set("is_active", value)} />
                <div className="row-actions">
                    <button type="submit" className="btn btn--primary btn--sm" disabled={busy || (!isNew && !dirty)} aria-busy={busy}>
                        {busy ? t("admin.saving") : isNew ? t("admin.add") : t("admin.save")}
                    </button>
                    {variant && <ConfirmButton question={t("admin.variant.deleteConfirm")} onConfirm={remove}>{t("admin.delete")}</ConfirmButton>}
                </div>
            </div>
        </form>
    );
}

/**
 * The variant's attribute values as compact rows (attribute → value), plus an
 * "add attribute" picker. Values are grouped by attribute id, not name, since
 * two attributes may share a name.
 */
function AttributePicker({ values, selected, onChange }: { values: AttributeValue[]; selected: number[]; onChange: (ids: number[]) => void }) {
    const { t } = usePreferences();
    const [pending, setPending] = useState<number | null>(null);

    const attributes = new Map<number, { name: string; values: AttributeValue[] }>();
    for (const value of values) {
        const entry = attributes.get(value.attribute_id) ?? { name: value.attribute ?? `#${value.attribute_id}`, values: [] };
        entry.values.push(value);
        attributes.set(value.attribute_id, entry);
    }

    const chosen = selected.map((id) => values.find((value) => value.id === id)).filter((value): value is AttributeValue => Boolean(value));
    const used = new Set(chosen.map((value) => value.attribute_id));
    const free = [...attributes].filter(([attributeId]) => !used.has(attributeId) && attributeId !== pending);

    const replace = (oldId: number, newId: number) => onChange(selected.map((id) => (id === oldId ? newId : id)));

    return (
        <fieldset className="attribute-rows">
            <legend>{t("admin.variant.attributes")}</legend>

            {chosen.map((value) => (
                <div key={value.id} className="attribute-rows__row">
                    <span className="attribute-rows__name">{attributes.get(value.attribute_id)?.name}</span>
                    <select value={value.id} onChange={(event) => replace(value.id, Number(event.target.value))} aria-label={attributes.get(value.attribute_id)?.name}>
                        {attributes.get(value.attribute_id)?.values.map((option) => <option key={option.id} value={option.id}>{option.value}</option>)}
                    </select>
                    <button type="button" className="icon-btn" onClick={() => onChange(selected.filter((id) => id !== value.id))} aria-label={`${t("admin.variant.removeAttribute")}: ${attributes.get(value.attribute_id)?.name}`}>
                        <Icon name="close" size={14} />
                    </button>
                </div>
            ))}

            {pending !== null && (
                <div className="attribute-rows__row">
                    <span className="attribute-rows__name">{attributes.get(pending)?.name}</span>
                    <select
                        value=""
                        autoFocus
                        onChange={(event) => { if (event.target.value) { onChange([...selected, Number(event.target.value)]); setPending(null); } }}
                        aria-label={attributes.get(pending)?.name}
                    >
                        <option value="">{t("admin.variant.pickValue")}</option>
                        {attributes.get(pending)?.values.map((option) => <option key={option.id} value={option.id}>{option.value}</option>)}
                    </select>
                    <button type="button" className="icon-btn" onClick={() => setPending(null)} aria-label={t("common.cancel")}>
                        <Icon name="close" size={14} />
                    </button>
                </div>
            )}

            {free.length > 0 && (
                <select className="attribute-rows__add" value="" onChange={(event) => event.target.value && setPending(Number(event.target.value))} aria-label={t("admin.variant.addAttribute")}>
                    <option value="">{t("admin.variant.addAttribute")}</option>
                    {free.map(([attributeId, entry]) => <option key={attributeId} value={attributeId}>{entry.name}</option>)}
                </select>
            )}
        </fieldset>
    );
}

/* ---------------------------------------------------------------- Images */

function ImagesPanel({ product, onChanged }: { product: Product; onChanged: () => void }) {
    const { t } = usePreferences();
    const { notify } = useToast();
    const input = useRef<HTMLInputElement>(null);
    const images = product.images ?? [];
    const [primaryFirst, setPrimaryFirst] = useState(images.length === 0);
    const [busy, setBusy] = useState(false);

    const upload = async (files: FileList | null) => {
        const list = [...(files ?? [])];
        const rejected = list.filter((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES);
        for (const file of rejected) {
            notify(t(file.size > MAX_IMAGE_BYTES ? "admin.images.tooBig" : "admin.images.badType", { name: file.name }), "error");
        }

        const accepted = list.filter((file) => !rejected.includes(file));
        if (accepted.length === 0) return;

        setBusy(true);
        let done = 0;

        try {
            for (const [index, file] of accepted.entries()) {
                await uploadProductImage(product.id, file, primaryFirst && index === 0);
                done++;
            }
            notify(t("admin.images.uploaded", { count: done }));
        } catch (error) {
            notify(errorMessage(error, t("common.error")), "error");
        } finally {
            setBusy(false);
            if (input.current) input.current.value = "";
            setPrimaryFirst(false);
            onChanged();
        }
    };

    const remove = async (imageId: number) => {
        try {
            await deleteProductImage(product.id, imageId);
            notify(t("admin.deleted"));
            onChanged();
        } catch (error) {
            notify(errorMessage(error, t("common.error")), "error");
        }
    };

    return (
        <section className="panel stack">
            <h2 className="panel__title">{t("admin.images")}</h2>

            {images.length === 0 ? <p className="muted">{t("admin.images.none")}</p> : (
                <ul className="image-grid">
                    {images.map((image) => (
                        <li key={image.id} className={image.is_primary ? "is-primary" : undefined}>
                            <img src={image.url} alt="" loading="lazy" />
                            {image.is_primary && <span className="badge badge--accent">{t("admin.images.primary")}</span>}
                            <ConfirmButton question={t("admin.images.deleteConfirm")} onConfirm={() => remove(image.id)} className="icon-btn image-grid__delete">
                                <Icon name="trash" size={16} />
                                <span className="sr-only">{t("admin.delete")}</span>
                            </ConfirmButton>
                        </li>
                    ))}
                </ul>
            )}

            <CheckField label={t("admin.images.primaryFirst")} hint={images.length ? t("admin.images.primaryNote") : undefined} checked={primaryFirst} onChange={setPrimaryFirst} />
            <label className={`btn btn--outline upload-btn${busy ? " is-busy" : ""}`} aria-busy={busy}>
                <Icon name="plus" size={18} /> {busy ? t("admin.saving") : t("admin.images.choose")}
                <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} multiple disabled={busy} onChange={(event) => upload(event.target.files)} />
            </label>
            <p className="muted small">{t("admin.images.hint")}</p>
        </section>
    );
}
