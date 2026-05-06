# Pharma Ecommerce - TODO

## Database & Backend
- [x] Schema: categories table
- [x] Schema: products table (with variants, inventory, image)
- [x] Schema: cart & cart_items tables
- [x] Schema: orders & order_items tables
- [x] Schema: addresses table
- [x] DB push migrations
- [x] Seed sample products (5 categories, 14 products)
- [x] tRPC router: categories (public list, admin CRUD)
- [x] tRPC router: products (public list/detail, admin CRUD, image upload)
- [x] tRPC router: cart (get, add, update, remove, clear)
- [x] tRPC router: orders (create, list for user, admin list all, update status)
- [x] tRPC router: addresses (list, add, update, delete)
- [x] tRPC router: admin users (list, update role)
- [x] Owner notification on new order
- [x] Customer confirmation on order placed

## Frontend - Public Store
- [x] Age Gate modal (confirm 21+, persisted in localStorage)
- [x] Global layout: top nav, footer with legal content
- [x] Home page: hero, featured products, category grid
- [x] Catalog page: filter by category, product grid
- [x] Product detail page: variants, add to cart
- [x] Cart drawer/page: items, quantities, subtotal
- [x] Checkout page: address, order summary, place order
- [x] Order confirmation page
- [x] User profile page: info, order history, saved addresses
- [x] Auth: login/register flow via Manus OAuth
- [x] Footer: FDA disclosure, THC notice, shipping/returns/support info

## Admin Panel
- [x] Admin layout with sidebar navigation
- [x] Admin: Dashboard overview (stats)
- [x] Admin: Categories management (CRUD)
- [x] Admin: Products management (CRUD + image upload)
- [x] Admin: Orders management (list, update status)
- [x] Admin: Users management (list, view, change role)
- [x] Admin: route protection (admin role only)

## Design & UX
- [x] Apple-inspired pharma design system (Inter font, white/gray palette, blue accents)
- [x] Responsive design (mobile-first)
- [x] Loading states and skeletons
- [x] Toast notifications for cart/order actions
- [x] Empty states for all lists

## Tests
- [x] Vitest: auth.logout test
- [x] Vitest: auth.me test
- [x] Vitest: categories.list test
- [x] Vitest: products.list and featured tests
- [x] Vitest: admin procedures (FORBIDDEN for non-admin, allowed for admin)
- [x] Vitest: cart UNAUTHORIZED test
