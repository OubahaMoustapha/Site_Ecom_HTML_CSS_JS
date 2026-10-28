import { useCallback, useId, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import Field, { SelectField } from "../../components/Field";
import { Async } from "../../components/StateViews";
import { usePreferences } from "../../context/preferences";
import { useToast } from "../../context/toast";
import { useAsync } from "../../hooks/useAsync";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { errorMessage, fieldErrors } from "../../lib/errors";
import { createStockMovement, getLowStock, getStockMovementsPage } from "../../services/adminService";
import { getAdminProductsPage } from "../../services/catalogService";
import { getAllPages } from "../../services/productService";
import type { StockMovement } from "../../types/api";

/** Every variant of the catalogue, to pick by SKU or product name. */
interface VariantOption {
    id: number;
    sku: string;
    stock: number;
    productId: number;
    productName: string;
}

async function loadVariantOptions(): Promise<VariantOption[]> {
    const products = await getAllPages((page) => getAdminProductsPage({ page, per_page: 50 }));

    return products.flatMap((product) => (product.variants ?? []).map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        stock: variant.stock ?? 0,
        productId: product.id,
        productName: product.name,
    })));
}

export default function AdminInventory() {
    const { t, formatDate } = usePreferences();
    useDocumentTitle(t("admin.inventory"));
    const [params, setParams] = useSearchParams();
    const page = Math.max(1, Number(params.get("page")) || 1);

    const variants = useAsync(loadVariantOptions);
    const lowStock = useAsync(getLowStock);
    const movements = useAsync(useCallback(() => getStockMovementsPage(page), [page]));
    const bySku = new Map((variants.data ?? []).map((variant) => [variant.sku, variant]));

    const changed = () => {
        variants.reload();
        lowStock.reload();
        movements.reload();
    };

    return (
        <div className="admin-page">
            <div className="admin-page__head">
                <h1 className="admin-page__title">{t("admin.inventory")}</h1>
            </div>

            <div className="admin-grid">
                <MovementForm options={variants.data ?? []} onDone={changed} />

                <section className="panel admin-card">
                    <h2>{t("admin.lowStock")}</h2>
                    <Async {...lowStock}>
                        {({ data }) => data.length === 0 ? <p className="muted">{t("admin.lowStock.none")}</p> : (
                            <table className="table table--compact">
                                <thead><tr><th>SKU</th><th className="num">{t("product.quantity")}</th><th className="num">{t("admin.threshold")}</th></tr></thead>
                                <tbody>
                                    {data.map((inventory) => {
                                        const variant = inventory.variant && bySku.get(inventory.variant.sku);
                                        return (
                                            <tr key={inventory.id}>
                                                <td className="mono">
                                                    {variant ? <Link to={`/admin/products/${variant.productId}`}>{inventory.variant?.sku}</Link> : inventory.variant?.sku}
                                                    {variant && <small className="muted">{variant.productName}</small>}
                                                </td>
                                                <td className="num mono">{inventory.quantity}</td>
                                                <td className="num mono">{inventory.low_stock_threshold}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </Async>
                </section>

                <section className="panel admin-card admin-card--wide">
                    <h2>{t("admin.movements")}</h2>
                    <Async {...movements}>
                        {({ data, meta }) => (
                            <>
                                <div className={`table-wrap${movements.loading ? " is-refreshing" : ""}`}>
                                    <table className="table table--compact">
                                        <thead>
                                            <tr>
                                                <th>{t("order.date")}</th>
                                                <th>SKU</th>
                                                <th>{t("admin.movement.type")}</th>
                                                <th className="num">{t("product.quantity")}</th>
                                                <th>{t("admin.movement.note")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((movement) => (
                                                <tr key={movement.id}>
                                                    <td>{formatDate(movement.created_at)}</td>
                                                    <td className="mono">{movement.variant?.sku}</td>
                                                    <td><span className={`move move--${movement.type}`}>{t(`admin.movement.${movement.type}`)}</span></td>
                                                    <td className="num mono">
                                                        {movement.quantity_before !== null && <small className="muted">{movement.quantity_before} → </small>}
                                                        {movement.type === "out" ? "−" : movement.type === "in" ? "+" : "="}{movement.quantity}
                                                    </td>
                                                    <td>{movement.note}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {meta.last_page > 1 && (
                                    <nav className="pager">
                                        <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>{t("listing.prev")}</button>
                                        <span>{t("listing.page", { page, total: meta.last_page })}</span>
                                        <button type="button" className="btn btn--outline btn--sm" disabled={page >= meta.last_page} onClick={() => setParams({ page: String(page + 1) })}>{t("listing.next")}</button>
                                    </nav>
                                )}
                            </>
                        )}
                    </Async>
                </section>
            </div>
        </div>
    );
}

function MovementForm({ options, onDone }: { options: VariantOption[]; onDone: () => void }) {
    const { t } = usePreferences();
    const { notify } = useToast();
    const listId = useId();
    const [sku, setSku] = useState("");
    const [type, setType] = useState<StockMovement["type"]>("in");
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const picked = options.find((option) => option.sku === sku.trim());

    const submit = async (event: FormEvent) => {
        event.preventDefault();

        if (!picked) {
            setErrors({ product_variant_id: t("admin.movement.pick.invalid") });
            return;
        }

        setBusy(true);
        setErrors({});

        try {
            await createStockMovement(picked.id, type, Number(quantity), note || undefined);
            notify(t("admin.movement.done"));
            setQuantity("");
            setNote("");
            onDone();
        } catch (error) {
            setErrors(fieldErrors(error));
            notify(errorMessage(error, t("common.error")), "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="panel admin-card stack" onSubmit={submit} noValidate>
            <h2>{t("admin.movement")}</h2>
            <Field
                label={t("admin.movement.pick")}
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                error={errors.product_variant_id}
                hint={picked ? `${picked.productName} · ${t("admin.movement.current", { count: picked.stock })}` : t("admin.movement.pick.hint")}
                list={listId}
                autoComplete="off"
                dir="ltr"
                required
            />
            <datalist id={listId}>
                {options.map((option) => <option key={option.id} value={option.sku}>{option.productName} · {option.stock}</option>)}
            </datalist>
            <SelectField label={t("admin.movement.type")} value={type} onChange={(value) => setType(value as StockMovement["type"])}>
                <option value="in">{t("admin.movement.in")}</option>
                <option value="out">{t("admin.movement.out")}</option>
                <option value="adjustment">{t("admin.movement.adjustment")}</option>
            </SelectField>
            <Field label={t("product.quantity")} type="number" min={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} error={errors.quantity} dir="ltr" required />
            <Field label={t("admin.movement.note")} value={note} onChange={(event) => setNote(event.target.value)} error={errors.note} />
            <button type="submit" className="btn btn--primary" disabled={busy} aria-busy={busy}>{t("admin.movement.submit")}</button>
        </form>
    );
}
