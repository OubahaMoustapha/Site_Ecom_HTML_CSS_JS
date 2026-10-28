// Catalogue management through the real UI, each step checked against the API.
// Everything it creates is deleted at the end, even when a step fails.
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adminToken, api, launch, reporter, samplePng } from "./lib.mjs";

const run = Math.random().toString(16).slice(2, 6);
const { check, finish } = reporter("admin");
const admin = await adminToken();
const created = { product: null, category: null, brand: null, attribute: null };

const b = await launch({ port: 9342 });

try {
    await b.go("/");
    await b.js(`localStorage.setItem("durra.token", ${JSON.stringify(admin)}); localStorage.setItem("durra.lang", "en"); true`);

    // ---------------------------------------------------------------- product: create
    await b.go("/admin/products/new");
    const name = `E2E Jacket ${run}`;
    await b.type("Name", name);
    check("slug follows the name", (await b.js(`${b.field("URL slug")}?.value`)) === `e2e-jacket-${run}`);
    const categories = (await api("GET", "/categories?per_page=100")).json.data;
    const sub = categories.find((category) => category.parent_id !== null) ?? categories[0];
    await b.type("Category", sub.id);
    await b.type("Base price", "799");
    await b.clickText("form button[type=submit]", "Save");
    check("create redirects to the editor", await b.waitFor(`/\\/admin\\/products\\/\\d+$/.test(location.pathname)`, 30000), await b.toasts());
    created.product = Number(await b.js(`location.pathname.split("/").pop()`)) || null;

    // ---------------------------------------------------------------- variant with stock and an attribute
    const values = [...(await api("GET", "/attribute-values?page=1")).json.data];
    const value = values[0];
    await b.waitFor(`!!document.querySelector(".variant-row--new")`);
    const newRow = `document.querySelector(".variant-row--new")`;
    await b.type("SKU", `E2E-${run}`, newRow);
    await b.type("Stock", "7", newRow);
    if (value) {
        await b.select(".variant-row--new .attribute-rows__add", value.attribute_id);
        await b.waitFor(`!!document.querySelector(".variant-row--new .attribute-rows__row select")`);
        await b.select(".variant-row--new .attribute-rows__row select", value.id);
    }
    await b.clickText(".variant-row--new button[type=submit]", "Add");
    await b.waitFor(`document.querySelectorAll(".variant-row:not(.variant-row--new)").length === 1`, 30000);
    let product = (await api("GET", `/products/${created.product}`, admin)).json.data;
    check("variant created with stock 7", product.variants[0]?.stock === 7, JSON.stringify(product.variants[0]));
    check("variant carries the picked attribute", !value || product.variants[0]?.attribute_values?.some((entry) => entry.id === value.id));

    // ---------------------------------------------------------------- stock change goes through the movement log
    const row = `document.querySelector(".variant-row:not(.variant-row--new)")`;
    await b.type("Stock", "3", row);
    await b.clickText(".variant-row:not(.variant-row--new) button[type=submit]", "Save");
    await b.waitFor(`[...document.querySelectorAll(".toast")].some((t) => t.textContent.includes("saved"))`, 30000);
    product = (await api("GET", `/products/${created.product}`, admin)).json.data;
    const movement = (await api("GET", "/stock-movements", admin)).json.data.find((entry) => entry.product_variant_id === product.variants[0].id);
    check("stock adjusted to 3 and logged as an adjustment", product.variants[0].stock === 3 && movement?.type === "adjustment", JSON.stringify(movement));

    // ---------------------------------------------------------------- photo upload
    const png = join(tmpdir(), `durra-e2e-${run}.png`);
    writeFileSync(png, samplePng());
    const { root } = (await b.send("DOM.getDocument")).result;
    const { nodeId } = (await b.send("DOM.querySelector", { nodeId: root.nodeId, selector: ".upload-btn input[type=file]" })).result;
    await b.send("DOM.setFileInputFiles", { nodeId, files: [png] });
    check("uploaded photo becomes the main photo", await b.waitFor(`document.querySelectorAll(".image-grid li.is-primary").length === 1`, 30000), await b.toasts());

    // ---------------------------------------------------------------- deactivate, then delete from the list
    await b.go(`/admin/products?q=${encodeURIComponent(name)}`);
    await b.waitFor(`document.querySelectorAll("tbody tr").length === 1`);
    await b.clickText("tbody .row-actions button", "Deactivate");
    await b.waitFor(`!!document.querySelector("tbody tr.is-muted")`);
    check("deactivated product is hidden from shoppers", (await api("GET", `/products/${created.product}`)).status === 404);
    await b.clickText("tbody .row-actions button", "Delete");
    await b.clickText(".confirm button", "Confirm");
    await b.waitFor(`document.querySelectorAll("tbody tr").length === 0 || !!document.querySelector(".state--empty")`);
    check("product deleted after inline confirmation", (await api("GET", `/products/${created.product}`, admin)).status === 404);
    if ((await api("GET", `/products/${created.product}`, admin)).status === 404) created.product = null;

    // ---------------------------------------------------------------- categories, brands, attributes
    const form = `document.querySelector("form.admin-card")`;
    await b.go("/admin/catalog?tab=categories");
    await b.waitFor(`!!document.querySelector(".tree__row")`);
    const catName = `E2E Category ${run}`;
    await b.type("Name", catName, form);
    await b.clickText("form.admin-card button[type=submit]", "Save");
    await b.waitFor(`document.body.innerText.includes(${JSON.stringify(catName)})`);
    created.category = (await api("GET", "/categories?per_page=100")).json.data.find((category) => category.name === catName)?.id ?? null;
    check("category created", Boolean(created.category));

    await b.go("/admin/catalog?tab=brands");
    await b.waitFor(`!!document.querySelector("form.admin-card")`);
    const brandName = `E2E Brand ${run}`;
    await b.type("Name", brandName, form);
    await b.clickText("form.admin-card button[type=submit]", "Save");
    check("brand created", await b.waitFor(`document.body.innerText.includes(${JSON.stringify(brandName)})`), await b.toasts());
    const brands = [];
    for (let page = 1; page <= 10; page++) {
        const { json } = await api("GET", `/brands?page=${page}`);
        brands.push(...json.data);
        if (page >= json.meta.last_page) break;
    }
    created.brand = brands.find((brand) => brand.name === brandName)?.id ?? null;

    await b.go("/admin/catalog?tab=attributes");
    await b.waitFor(`!!document.querySelector("form.admin-card")`);
    const attrName = `E2E Material ${run}`;
    await b.type("Name", attrName, form);
    await b.clickText("form.admin-card button[type=submit]", "Save");
    const card = `[...document.querySelectorAll(".attribute-card")].find((c) => c.querySelector("strong")?.textContent === ${JSON.stringify(attrName)})`;
    check("attribute created", await b.waitFor(`!!${card}`), await b.toasts());
    await b.js(`(() => { const i = ${card}.querySelector(".inline-form input"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "Wool"); i.dispatchEvent(new Event("input", { bubbles: true })); ${card}.querySelector(".inline-form button").click(); return true; })()`);
    check("attribute value added", await b.waitFor(`${card}?.querySelector(".value-chip")?.textContent.includes("Wool")`), await b.toasts());
    created.attribute = (await api("GET", "/attributes?page=1")).json.data.find((attribute) => attribute.name === attrName)?.id ?? null;

    check("no uncaught JavaScript errors", b.errors.length === 0, b.errors.slice(0, 3).join(" | "));
} finally {
    if (created.product) await api("DELETE", `/products/${created.product}`, admin);
    if (created.category) await api("DELETE", `/categories/${created.category}`, admin);
    if (created.brand) await api("DELETE", `/brands/${created.brand}`, admin);
    if (created.attribute) await api("DELETE", `/attributes/${created.attribute}`, admin);
    await api("POST", "/auth/logout", admin);
    b.close();
}

process.exit(finish() ? 0 : 1);
