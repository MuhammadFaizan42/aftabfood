# New Order Flow – Backend Database Suggestion (UI ke mutabiq)

Yeh suggestion aapki current UI (New Order → Customer Select → Customer Dashboard → Products → Cart → Review → Submit) ke hisaab se hai.

---

## 1. Tables Required (Required Tables)

### 1.1 `customers` (ya existing customer table)

Aapka UI customer list me ye fields use karta hai (`getCustomers` / customer.php):

| Column / Field       | Type         | Required | UI Usage |
|----------------------|-------------|----------|----------|
| `PK_ID`              | INT (PK)    | ✓        | Unique ID, list key |
| `CUSTOMER_ID`        | VARCHAR     | Optional | Fallback code |
| `SHORT_CODE`         | VARCHAR     | ✓        | **party_code** – New Order select, dashboard URL, dashboard API |
| `CUSTOMER_NAME`      | VARCHAR     | ✓        | Name display, search |
| `ST`                 | VARCHAR     | Optional | Address (Street) – location/format |
| `ADRES`              | VARCHAR     | Optional | Address – location/format |
| `DIVISION`           | VARCHAR     | Optional | Address |
| `PROVINCES`          | VARCHAR     | Optional | Address |
| `TEHSIL`             | VARCHAR     | Optional | Address |
| `AREA_DIS`           | VARCHAR     | Optional | Address |
| `CONT_PERSON`        | VARCHAR     | Optional | Contact person name |
| `CONT_NUM`           | VARCHAR     | Optional | Phone |
| `EMP_PIC`            | VARCHAR/URL | Optional | Avatar image |
| `ACT_STATUS`         | CHAR(1)     | Optional | e.g. 'Y' = Active (status badge) |
| `customer_category`  | VARCHAR     | Optional | Create customer form, filters |

**Note:** Agar backend pe alag table/columns ke names hain (e.g. `party_code` instead of `SHORT_CODE`) to API layer me map karke UI ko `SHORT_CODE`, `CUSTOMER_NAME` etc. dena hoga.

---

### 1.2 `orders` (Order Header – new order create/store)

Customer dashboard me **Recent Orders** me `BRV_NUM`, `DATED`, `INVOICE_AMT`/`LC_AMT`, `STATUS` dikhate hain. Naya order save karne ke liye ye table suggest hai:

| Column           | Type          | Required | UI / API Usage |
|------------------|---------------|----------|-----------------|
| `id`             | INT/BIGINT PK | ✓        | Internal PK |
| `order_number`   | VARCHAR       | ✓        | Unique – UI "Order #" (e.g. BRV_NUM style) |
| `party_code`     | VARCHAR       | ✓        | FK to customer (SHORT_CODE) – kis customer ka order |
| `order_date`     | DATE/DATETIME | ✓        | Order date (DATED) |
| `subtotal`       | DECIMAL(15,2)| ✓        | Items total before tax |
| `tax`            | DECIMAL(15,2)| Optional | Tax amount (review me 8% dikhaya) |
| `discount`       | DECIMAL(15,2)| Optional | Discount amount |
| `grand_total`    | DECIMAL(15,2)| ✓        | Final amount (INVOICE_AMT / LC_AMT) |
| `status`         | VARCHAR      | ✓        | e.g. 'Draft', 'Completed', 'Cancelled' (STATUS) |
| `payment_terms`  | VARCHAR      | Optional | Review page "Payment Terms" |
| `delivery_notes` | TEXT         | Optional | Delivery address / notes |
| `created_at`     | DATETIME     | ✓        | Record create time |
| `updated_at`     | DATETIME     | Optional | Last update |
| `created_by`     | INT/VARCHAR  | Optional | User id (agar multi-user) |

**Index:** `party_code`, `order_date`, `order_number` (unique).

---

### 1.3 `order_items` / `order_lines` (Order Line Items)

Cart / Review me har line pe: product, SKU, unit price, quantity, line total. Iske liye:

| Column        | Type          | Required | UI / API Usage |
|---------------|---------------|----------|-----------------|
| `id`          | INT/BIGINT PK | ✓        | Line ID |
| `order_id`    | INT/BIGINT    | ✓        | FK → orders.id |
| `product_id`  | INT/VARCHAR   | ✓        | FK → products (PK_ID / id) |
| `product_sku` | VARCHAR       | ✓        | Snapshot – Cart/Review "SKU" |
| `product_name`| VARCHAR       | ✓        | Snapshot – Cart/Review name |
| `quantity`    | DECIMAL(12,3)| ✓        | Ordered qty |
| `unit`        | VARCHAR       | Optional | UOM (e.g. Unit, Kg, Box) |
| `unit_price`  | DECIMAL(15,2)| ✓        | Price per unit at order time |
| `line_total`  | DECIMAL(15,2)| ✓        | unit_price * quantity (ya calculated) |
| `sequence_no` | INT          | Optional | Line order 1,2,3... |

**Index:** `order_id`, `product_id`.

---

### 1.4 `products` (Product catalog)

Products page `getProducts` / product.php se ye fields use karta hai:

| Column / Field   | Type         | Required | UI Usage |
|------------------|-------------|----------|----------|
| `PK_ID` / `id`   | INT (PK)     | ✓        | Product id, cart key |
| `SKU`            | VARCHAR      | ✓        | Product code, search, display |
| `PRODUCT_NAME`   | VARCHAR      | ✓        | Name on card |
| `CATEGORY`       | VARCHAR      | Optional | Category filter/tabs |
| `PRICE`          | DECIMAL      | ✓        | Unit price (editable in UI) |
| `UOM`            | VARCHAR      | Optional | Unit of measure |
| `STOCK` / `QTY`  | DECIMAL/INT  | Optional | Stock / inStock |
| `IMAGE` / `PIC`  | VARCHAR      | Optional | Image URL |
| `DESCRIPTION`    | TEXT         | Optional | Description text |

Agar backend me table pehle se hai to bas ensure karein in names se (ya API me map) data aa raha ho.

---

## 2. Optional / Future Tables

- **users** – Login, `created_by` in orders (agar multi-user ho).
- **customer_categories** – Agar category list separate table me rakhni ho (abhi UI `category_only=1` se fetch karti hai).
- **tax_rates** – Agar tax % configurable ho (abhi UI me 8% hardcoded).

---

## 3. API Payload Suggestion – Create Order

`createOrder(payload)` ke liye payload structure (UI se backend tak):

```json
{
  "party_code": "9886",
  "order_date": "2025-02-15",
  "payment_terms": "Net 30 Days",
  "delivery_notes": "",
  "items": [
    {
      "product_id": 101,
      "product_sku": "CF-001",
      "product_name": "Premium Arabica Coffee",
      "quantity": 2,
      "unit": "500g",
      "unit_price": 12.50,
      "line_total": 25.00
    }
  ],
  "subtotal": 50.50,
  "tax": 4.04,
  "discount": 0,
  "grand_total": 54.54
}
```

Backend:
- `orders` me ek row insert kare (order_number generate karke, e.g. BRV_NUM style).
- Har `items[]` ke liye `order_items` me ek row insert kare, `order_id` = new order id.

---

## 4. Summary – Minimum Tables & Columns

| Table         | Purpose              | Key columns (min) |
|---------------|----------------------|--------------------|
| **customers** | Customer list & link | PK_ID, SHORT_CODE (party_code), CUSTOMER_NAME, address fields, CONT_PERSON, CONT_NUM, ACT_STATUS |
| **orders**    | Order header         | id, order_number, party_code, order_date, subtotal, tax, discount, grand_total, status, created_at |
| **order_items** | Order lines       | id, order_id, product_id, product_sku, product_name, quantity, unit, unit_price, line_total |
| **products**  | Catalog              | id/PK_ID, SKU, PRODUCT_NAME, CATEGORY, PRICE, UOM, STOCK, IMAGE, DESCRIPTION |

Agar aapka existing backend in names se different hai (e.g. Urdu script ya different naming) to bata dein, same structure ko aapke column names me translate kar sakta hoon.
