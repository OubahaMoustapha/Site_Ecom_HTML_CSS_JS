import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import ErrorBoundary from "./components/ErrorBoundary";
import StoreLayout from "./components/layout/StoreLayout";
import { Loading, NotFound } from "./components/StateViews";
import AuthProvider from "./context/AuthProvider";
import CartProvider from "./context/CartProvider";
import PreferencesProvider from "./context/PreferencesProvider";
import ToastProvider from "./context/ToastProvider";
import WishlistProvider from "./context/WishlistProvider";
import WorldsProvider from "./context/WorldsProvider";
import AccountPage from "./pages/AccountPage";
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from "./pages/AuthPages";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import OrderPage from "./pages/OrderPage";
import ProductPage from "./pages/ProductPage";
import SearchPage from "./pages/SearchPage";
import WishlistPage from "./pages/WishlistPage";
import WorldPage from "./pages/WorldPage";
import WorldsPage from "./pages/WorldsPage";

// Rarely visited text pages and the admin area are loaded on demand.
const InfoPage = lazy(() => import("./pages/InfoPage"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductEditor = lazy(() => import("./pages/admin/AdminProductEditor"));
const AdminCatalog = lazy(() => import("./pages/admin/AdminCatalog"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));

export default function App() {
    return (
        <BrowserRouter>
            <PreferencesProvider>
                <ToastProvider>
                    <AuthProvider>
                        <WorldsProvider>
                            <WishlistProvider>
                                <CartProvider>
                                    <ErrorBoundary>
                                        <Suspense fallback={<Loading />}>
                                            <Routes>
                                                <Route element={<StoreLayout />}>
                                                    <Route index element={<HomePage />} />
                                                    <Route path="worlds" element={<WorldsPage />} />
                                                    <Route path="world/:key" element={<WorldPage />} />
                                                    <Route path="product/:id" element={<ProductPage />} />
                                                    <Route path="search" element={<SearchPage />} />
                                                    <Route path="wishlist" element={<WishlistPage />} />
                                                    <Route path="cart" element={<CartPage />} />
                                                    <Route path="checkout" element={<CheckoutPage />} />
                                                    <Route path="login" element={<LoginPage />} />
                                                    <Route path="register" element={<RegisterPage />} />
                                                    <Route path="forgot-password" element={<ForgotPasswordPage />} />
                                                    {/* Target of the password reset email (see AppServiceProvider in the API). */}
                                                    <Route path="reset-password" element={<ResetPasswordPage />} />
                                                    <Route path="account" element={<AccountPage />} />
                                                    <Route path="account/orders/:id" element={<OrderPage />} />
                                                    <Route path="info/:slug" element={<InfoPage />} />
                                                    <Route path="*" element={<NotFound />} />
                                                </Route>

                                                <Route path="admin" element={<AdminLayout />}>
                                                    <Route index element={<AdminDashboard />} />
                                                    <Route path="orders" element={<AdminOrders />} />
                                                    <Route path="orders/:id" element={<AdminOrderDetail />} />
                                                    <Route path="products" element={<AdminProducts />} />
                                                    <Route path="products/:id" element={<AdminProductEditor />} />
                                                    <Route path="catalog" element={<AdminCatalog />} />
                                                    <Route path="inventory" element={<AdminInventory />} />
                                                </Route>
                                            </Routes>
                                        </Suspense>
                                    </ErrorBoundary>
                                </CartProvider>
                            </WishlistProvider>
                        </WorldsProvider>
                    </AuthProvider>
                </ToastProvider>
            </PreferencesProvider>
        </BrowserRouter>
    );
}
