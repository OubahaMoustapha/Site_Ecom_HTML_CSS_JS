import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router";
import CategoryOptions from "../../components/CategoryOptions";
import ConfirmButton from "../../components/admin/ConfirmButton";
import Icon from "../../components/icons";
import ProductImage from "../../components/ProductImage";
import { Async, Empty } from "../../components/StateViews";
import { usePreferences } from "../../context/preferences";
import { useToast } from "../../context/toast";
import { useAsync } from "../../hooks/useAsync";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { payloadOf } from "../../lib/catalog";
import { errorMessage } from "../../lib/errors";
import { productIcon } from "../../lib/productIcon";
import { displayPrice, primaryImage } from "../../lib/variants";
import { loadCategories } from "../../lib/worlds";
import { ApiRequestError } from "../../services/apiClient";
import { deleteProduct, getAdminProductsPage, updateProduct } from "../../services/catalogService";
import type { Product } from "../../types/api";

const PAGE_SIZE = 20;

export default function AdminProducts() {
    const { t } = usePreferences();
    useDocumentTitle(t("admin.products"));
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState(params.get("q") ?? "");

    const page = Math.max(1, Number(params.get("page")) || 1);
    const q = params.get("q") ?? "";
    const categoryId = Number(params.get("cat")) || undefined;
    const status = params.get("status");

    const categories = useAsync(loadCategories);
    const result = useAsync(useCallback(() => getAdminProductsPage({
        page,
        per_page: PAGE_SIZE,
        search: q || undefined,
        category_id: categoryId,
        is_active: status === "active" ? true : status === "inactive" ? false : undefined,
        sort: "-created_at",
    }), [page, q, categoryId, status]));

    const go = (changes: Record<string, string | undefined>) => {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value); else next.delete(key);
        }
        if (!("page" in changes)) next.delete("page");
        setParams(next);
    };

    return (
        <div className="admin-page">
            <div className="admin-page__head">
                <h1 className="admin-page__title">{t("admin.products")}</h1>
                <Link to="/admin/products/new" className="btn btn--primary"><Icon name="plus" size={18} /> {t("admin.product.new")}</Link>
            </div>

            <form className="admin-filters" role="search" onSubmit={(event) => { event.preventDefault(); go({ q: search.trim() || undefined }); }}>
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("admin.search")} aria-label={t("admin.search")} />
                <select value={categoryId ?? ""} onChange={(event) => go({ cat: event.target.value || undefined })} aria-label={t("admin.product.category")}>
                    <option value="">{t("admin.allCategories")}</option>
                    {categories.data && <CategoryOptions categories={categories.data} />}
                </select>
                <select value={status ?? ""} onChange={(event) => go({ status: event.target.value || undefined })} aria-label={t("admin.filterStatus")}>
                    <option value="">{t("admin.status.all")}</option>
                    <option value="active">{t("admin.status.active")}</option>
                    <option value="inactive">{t("admin.status.inactive")}</option>
                </select>
                <button type="submit" className="btn btn--outline"><Icon name="search" size={16} /> {t("admin.find")}</button>
            </form>

            <Async {...result}>
                {({ data, meta }) => data.length === 0 ? <Empty icon="box" title={t("admin.empty")} /> : (
                    <div className={`panel${result.loading ? " is-refreshing" : ""}`}>
                        <p className="muted small">{t("admin.results", { count: meta.total })}</p>
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t("admin.field.name")}</th>
                                        <th>{t("admin.product.category")}</th>
                                        <th className="num">{t("admin.variant.price")}</th>
                                        <th className="num">{t("admin.variant.stock")}</th>
                                        <th>{t("order.status")}</th>
                                        <th>{t("admin.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((product) => <ProductRow key={product.id} product={product} onChanged={result.reload} />)}
                                </tbody>
                            </table>
                        </div>

                        {meta.last_page > 1 && (
                            <nav className="pager">
                                <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => go({ page: String(page - 1) })}>{t("listing.prev")}</button>
                                <span>{t("listing.page", { page, total: meta.last_page })}</span>
                                <button type="button" className="btn btn--outline btn--sm" disabled={page >= meta.last_page} onClick={() => go({ page: String(page + 1) })}>{t("listing.next")}</button>
                            </nav>
                        )}
                    </div>
                )}
            </Async>
        </div>
    );
}

function ProductRow({ product, onChanged }: { product: Product; onChanged: () => void }) {
    const { t, formatMoney } = usePreferences();
    const { notify } = useToast();
    const [busy, setBusy] = useState(false);
    const variants = product.variants ?? [];
    const stock = variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0);
    const image = primaryImage(product);

    const toggle = async () => {
        setBusy(true);
        try {
            await updateProduct(product.id, { ...payloadOf(product), is_active: !product.is_active });
            notify(t("admin.saved"));
            onChanged();
        } catch (error) {
            notify(errorMessage(error, t("common.error")), "error");
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        try {
            await deleteProduct(product.id);
            notify(t("admin.deleted"));
            onChanged();
        } catch (error) {
            const ordered = error instanceof ApiRequestError && error.status === 409;
            notify(ordered ? t("admin.product.ordered") : errorMessage(error, t("common.error")), "error");
        }
    };

    return (
        <tr className={product.is_active ? undefined : "is-muted"}>
            <td>
                <Link to={`/admin/products/${product.id}`} className="admin-product">
                    <span className="admin-product__thumb">
                        <ProductImage key={image} src={image} alt="" fallback={<Icon name={productIcon([product.name, product.category], null)} size={20} />} />
                    </span>
                    <span>
                        <strong>{product.name}</strong>
                        <small className="muted">{product.brand ?? "—"} · {t("admin.product.variants", { count: variants.length })}</small>
                    </span>
                </Link>
            </td>
            <td>{product.category ?? <span className="muted">—</span>}</td>
            <td className="num mono">{formatMoney(displayPrice(product))}</td>
            <td className={`num mono${stock === 0 ? " text-danger" : ""}`}>{stock}</td>
            <td>
                <span className={`badge ${product.is_active ? "status--completed" : "status--cancelled"}`}>
                    {t(product.is_active ? "admin.status.active" : "admin.status.inactive")}
                </span>
            </td>
            <td>
                <div className="row-actions">
                    <Link to={`/admin/products/${product.id}`} className="btn btn--outline btn--sm">{t("admin.edit")}</Link>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={toggle} disabled={busy}>
                        {t(product.is_active ? "admin.deactivate" : "admin.activate")}
                    </button>
                    <ConfirmButton question={t("admin.product.deleteConfirm")} onConfirm={remove}>{t("admin.delete")}</ConfirmButton>
                </div>
            </td>
        </tr>
    );
}
