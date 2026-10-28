// Customer journey through the real UI: register → verify e-mail → cart → checkout →
// paid order → admin moves it to "processing". Cleans up by cancelling the order.
import { adminToken, api, EMAIL_PATTERN, launch, reporter, verificationUrl } from "./lib.mjs";

const run = Math.random().toString(16).slice(2, 8);
const email = EMAIL_PATTERN.replace("{run}", run);
const { check, finish } = reporter("shop");
const admin = await adminToken();

// Any active product with a variant in stock.
const products = (await api("GET", "/products?per_page=50")).json.data;
const product = products.find((entry) => entry.variants?.some((variant) => variant.is_active && variant.stock > 1));
if (!product) throw new Error("No product with stock: add one in the admin first");

const b = await launch({ port: 9341 });
let orderId = null;

try {
    // Arabic interface (the default): labels below are the Arabic ones.
    await b.go("/register");
    await b.type("الاسم", "E2E Shopper");
    await b.type("البريد الإلكتروني", email);
    await b.type("كلمة المرور", "Password123!");
    await b.type("تأكيد كلمة المرور", "Password123!");
    await b.click("form button[type=submit]");
    check("register lands on the account page", await b.waitFor(`location.pathname === "/account"`, 60000), await b.js("location.pathname"));
    check("account warns the e-mail is unverified", await b.waitFor(`!!document.querySelector(".note--warn")`));

    await b.go(`/product/${product.id}`);
    check("add-to-cart enabled once the session is restored", await b.waitFor(`!!document.querySelector(".product__buy .btn--primary:not([disabled])")`, 30000));
    await b.click(".product__buy .btn--primary");
    check("header cart count becomes 1", await b.waitFor(`document.querySelector(".cart-btn__count")?.textContent === "1"`, 30000), await b.toasts());

    await b.go("/cart");
    await b.waitFor(`document.querySelectorAll(".cart-line").length === 1`);
    await b.click(".cart-line .stepper__btn--plus");
    check("quantity can be increased in the cart", await b.waitFor(`document.querySelector(".cart-line .stepper__value")?.textContent === "2"`));

    await b.go("/checkout");
    check("unverified: place-order is disabled with a notice", await b.waitFor(`!!document.querySelector(".note--warn") && document.querySelector("form button[type=submit]")?.disabled === true`));
    check("checkout links to the terms", await b.js(`!!document.querySelector('a[href="/info/terms"]')`));

    await b.send("Page.navigate", { url: verificationUrl(email) });
    check("verification link returns to the account with a confirmation", await b.waitFor(`location.search.includes("verified=1") && !!document.querySelector(".note--success")`, 30000), await b.js("location.href"));

    await b.go("/checkout");
    await b.type("الاسم الكامل", "E2E Shopper");
    await b.type("الهاتف", "0611223344");
    await b.type("العنوان", "12 Rue des Tests");
    await b.type("المدينة", "Rabat");
    await b.click("input[name=method][value=card]");
    await b.click("form button[type=submit]");
    check("order placed and paid", await b.waitFor(`/^\\/account\\/orders\\/\\d+$/.test(location.pathname) && !!document.querySelector(".status--paid")`, 120000), await b.toasts());
    orderId = Number(await b.js(`location.pathname.split("/").pop()`)) || null;
    check("cart emptied after the order", await b.js(`document.querySelector(".cart-btn__count")?.textContent === "0"`));

    await b.go("/info/returns");
    check("information pages render", await b.waitFor(`document.querySelectorAll(".info-page__block").length > 0`));

    await b.click(".lang-btn");
    check("language switch to English (LTR)", await b.waitFor(`document.documentElement.dir === "ltr" && document.documentElement.lang === "en"`, 3000));
    await b.click(".lang-btn");

    if (orderId) {
        const { status } = await api("PATCH", `/admin/orders/${orderId}/status`, admin, { status: "processing" });
        check("admin can move the order to processing", status === 200, status);
    }

    check("no uncaught JavaScript errors", b.errors.length === 0, b.errors.slice(0, 3).join(" | "));
} finally {
    // Cancelling returns the reserved stock.
    if (orderId) await api("PATCH", `/admin/orders/${orderId}/status`, admin, { status: "cancelled" });
    await api("POST", "/auth/logout", admin);
    b.close();
}

process.exit(finish() ? 0 : 1);
