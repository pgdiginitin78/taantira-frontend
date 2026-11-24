import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { taantiraTheme } from './config/muiTheme';
import { useAuthStore } from './store/useAuthStore';

import StarterPage from './components/StarterPage';
import ProtectedRoute from './components/ProtectedRoute';
import StorefrontLayout from './layouts/StorefrontLayout';
import AccountLayout from './layouts/AccountLayout';
import AdminLayout from './layouts/AdminLayout';

import HomePage from './pages/HomePage';
import CollectionPage from './pages/CollectionPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DeliveryPortalPage from './pages/DeliveryPortalPage';

import AccountOverviewPage from './pages/account/AccountOverviewPage';
import AccountOrdersPage from './pages/account/AccountOrdersPage';
import AccountOrderDetailPage from './pages/account/AccountOrderDetailPage';
import AccountWishlistPage from './pages/account/AccountWishlistPage';
import AccountAddressesPage from './pages/account/AccountAddressesPage';
import AccountReturnsPage from './pages/account/AccountReturnsPage';
import AccountProfilePage from './pages/account/AccountProfilePage';
import AccountPaymentsPage from './pages/account/AccountPaymentsPage';
import {
  AccountNotificationsPage,
  AccountReviewsSupportPage,
} from './pages/account/AccountNotificationsAndSupportPages';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminSubcategoriesPage from './pages/admin/AdminSubcategoriesPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminReturnsSupportPage from './pages/admin/AdminReturnsSupportPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminDeliveryPage from './pages/admin/AdminDeliveryPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

const ADMIN_STAFF_ROLES = [
  'super_admin',
  'catalogue_manager',
  'order_manager',
  'inventory_manager',
  'finance_manager',
  'marketing_manager',
  'delivery_manager',
  'customer_support_agent',
];

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <ThemeProvider theme={taantiraTheme}>
      <BrowserRouter>
        <Routes>
          {/* Taantira Sarees & Jewellery Storefront directly at / */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/store" element={<Navigate to="/" replace />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer Dashboard Routes */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AccountOverviewPage />} />
              <Route path="orders" element={<AccountOrdersPage />} />
              <Route path="orders/:id" element={<AccountOrderDetailPage />} />
              <Route path="wishlist" element={<AccountWishlistPage />} />
              <Route path="addresses" element={<AccountAddressesPage />} />
              <Route path="returns" element={<AccountReturnsPage />} />
              <Route path="profile" element={<AccountProfilePage />} />
              <Route path="payments" element={<AccountPaymentsPage />} />
              <Route path="reviews" element={<AccountReviewsSupportPage />} />
              <Route path="notifications" element={<AccountNotificationsPage />} />
            </Route>
          </Route>

          {/* Preserved original Vite starter page */}
          <Route path="/starter" element={<StarterPage />} />

          {/* Delivery Partner Web Portal */}
          <Route path="/delivery" element={<DeliveryPortalPage />} />

          {/* Role-Based Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={ADMIN_STAFF_ROLES}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route
              path="categories"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminCategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="subcategories"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminSubcategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminProductsPage />
                </ProtectedRoute>
              }
            />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="returns" element={<AdminReturnsSupportPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="delivery" element={<AdminDeliveryPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
