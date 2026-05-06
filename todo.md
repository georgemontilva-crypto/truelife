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

## Mejoras v2 - Variantes, Características y Lab Reports
- [x] Esquema DB: tabla product_variants (nombre, precio propio, stock, sku)
- [x] Esquema DB: tabla product_attributes (clave-valor: sabor, ingrediente activo, etc.)
- [x] Esquema DB: tabla lab_reports (por variante o por producto, con URL de PDF)
- [x] Backend: CRUD de variantes con precio individual
- [x] Backend: CRUD de atributos/características del producto
- [x] Backend: CRUD de lab reports por variante/producto
- [x] Admin: formulario de variantes con precio, stock y SKU por variante
- [x] Admin: sección de características personalizadas (key-value)
- [x] Admin: sección de lab reports con upload de PDF por variante
- [x] Fix: diseño móvil - overflow y grid de productos
- [x] Fix: ProductCard responsive en mobile
- [x] Fix: Navbar overflow en mobile
- [x] Tienda: detalle de producto muestra variantes con precio individual
- [x] Tienda: detalle de producto muestra características y lab reports

## Mejoras v3 - Paleta Blanco/Negro y Logos SVG
- [x] Subir 4 SVGs al storage (free-shipping, risk-money, natural, labtested)
- [x] Cambiar paleta global: azul → negro (index.css, variables CSS)
- [x] Actualizar Navbar: azul → negro
- [x] Actualizar Home: hero, badges, categorías, featured → negro
- [x] Actualizar Footer: azul → negro
- [x] Actualizar ProductDetail: badges, botones → negro
- [x] Actualizar AgeGate: botón → negro
- [x] Actualizar CartDrawer: botones → negro
- [x] Actualizar CheckoutPage: botones → negro
- [x] Actualizar Admin: sidebar, botones → negro
- [x] Integrar 4 logos SVG en sección trust badges del Home
- [x] Integrar logos SVG en Footer
- [x] Integrar logos SVG en ProductDetail

## Mejoras v5 - Slider, Imágenes de Categorías y About Us
- [x] DB: tabla banners (id, title, subtitle, imageUrl, linkUrl, sortOrder, isActive)
- [x] DB: campo imageUrl en tabla categories
- [x] Backend: CRUD de banners (admin)
- [x] Backend: actualizar upsert de categorías con imageUrl
- [x] Admin: página de gestión de banners con upload de imagen
- [x] Admin: campo de upload de imagen en formulario de categorías
- [x] Home: slider de banners con dots y autoplay
- [x] Home: categorías con imagen de fondo
- [x] Home: sección About Us con texto e imagen
- [x] Página /about - sección About Us integrada en Home (id="about")

## Lab Reports por Producto
- [x] DB: columna labReportUrl en tabla products
- [x] Backend: incluir labReportUrl en upsert y queries de productos
- [x] Admin: sección "Lab Reports / COA" con upload de PDF por variante en panel de producto
- [x] Tienda: botón prominente "View Lab Reports / COA" en página de detalle del producto
