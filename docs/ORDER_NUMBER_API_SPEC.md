# Order Number API – Requirement / Specification

## 1. Order number format

Order number format ye hona chahiye:

```
SO / {FISCAL_YEAR} / {SEQUENCE}
```

**Examples:**
- `SO/2526/00001` – Sale Order, Fiscal Year 2526 (2025–26), Sequence 1
- `SO/2526/00002` – same fiscal year, next order
- `SO/2627/00001` – new fiscal year 2627 (2026–27), sequence 1 se start

**Parts:**
- **SO** – fixed prefix (Sale Order)
- **FISCAL_YEAR** – 4 digits: last 2 digits of start year + last 2 digits of end year  
  - 1 July 2025 – 30 June 2026 → **2526**  
  - 1 July 2026 – 30 June 2027 → **2627**
- **SEQUENCE** – 5-digit running number (00001, 00002, …), **har naye fiscal year pe 00001 se reset**

---

## 2. Fiscal year rule

- **Fiscal year:** 1 July (start) – 30 June (end).
- **New fiscal year:** 1 July ko start, us din se naya FISCAL_YEAR aur sequence 00001 se start.
- **Fiscal year code:**  
  - Current date se decide karein: agar month >= 7 to year = current year, warna year = current year - 1.  
  - FISCAL_YEAR = (start_year % 100) * 100 + (end_year % 100).  
  - Example: 1 Jul 2025 – 30 Jun 2026 → start 2025, end 2026 → **2526**.

---

## 3. Kis type ka API chahiye

Backend pe **ek hi clear responsibility** honi chahiye:  
**“Next order number generate karo (SO/FY/SEQ format mein) aur use order ke saath save karo.”**

Iske liye do tareeke ho sakte hain:

### Option A: Dedicated “get next order number” API (recommended)

**Purpose:** Order create/submit se pehle ya order save karte waqt next available order number get karna.

**Suggested endpoint (example):**

- **Method:** GET (ya POST agar audit log chahiye)
- **URL example:**  
  `GET /restful/models/sale_order.php?action=get_next_order_number`  
  ya  
  `GET /restful/models/order_number.php?type=SO`

**Response (example):**

```json
{
  "success": true,
  "data": {
    "order_number": "SO/2526/00001",
    "fiscal_year": "2526",
    "sequence": 1
  }
}
```

**Backend logic (high level):**

1. Current date se **fiscal year** nikaalo (1 Jul – 30 Jun).
2. DB se is fiscal year ka **last sequence** get karo (e.g. MAX(sequence) WHERE fiscal_year = 2526).
3. **Next sequence** = last + 1 (agar koi order nahi to 1).
4. **order_number** = `"SO/" + fiscal_year + "/" + pad(sequence, 5)`.
5. Optionally: isi time pe ek row insert/update karo (e.g. order_sequences table) taake next request pe next number mile.
6. Response mein `order_number` return karo.

Is number ko order create/submit waqt order record ke saath save karna hoga (e.g. `order_number` column).

---

### Option B: Order submit/create API hi number generate kare

**Purpose:** Order submit/create API andar hi next SO/2526/00001 generate kare aur response mein de.

**Existing endpoint (example):**

- `POST .../sale_order.php?action=submit_order`  
  (ya jahan order create/submit hota hai)

**Required change:**

- Submit/create order ke andar:
  1. Current fiscal year calculate karo.
  2. Is fiscal year ke liye next sequence lo (DB se MAX+1 ya sequence table).
  3. Order number banao: `SO/{fiscal_year}/{sequence_5_digits}`.
  4. Is number ko order table mein save karo (e.g. `order_number`).
  5. Response mein ye number return karo.

**Response (example):**

```json
{
  "success": true,
  "data": {
    "trns_id": 12345,
    "order_number": "SO/2526/00001",
    "order_id": "SO/2526/00001"
  }
}
```

Frontend ab display ke liye `order_number` use karega (order success, list, reports).

---

## 4. Kaun sa data kis table se aa sakta hai

### 4.1 Sequence / fiscal year (next number ke liye)

Ye data **ek dedicated table** se aana best hai taake sequence unique rahe aur reset sahi ho.

**Option 1: Order sequences table (recommended)**

| Table (example)   | Column (example) | Description |
|-------------------|------------------|-------------|
| `order_sequences` | `fiscal_year`    | e.g. 2526, 2627 (PK ya unique part) |
|                   | `last_sequence`  | Last used sequence (integer) |
|                   | `updated_at`     | Last update time |

- Logic:  
  - Current date se `fiscal_year` nikaalo.  
  - `WHERE fiscal_year = ?` se row get karo; agar nahi mile to insert (sequence = 1).  
  - `last_sequence = last_sequence + 1` (with lock / transaction).  
  - Order number = `SO/` + fiscal_year + `/` + zero-pad(last_sequence, 5).

**Option 2: Orders table se derive (agar dedicated table nahi bana sakte)**

| Table (example) | Column (example) | Use |
|------------------|------------------|-----|
| `orders` / `sale_orders` | `order_number` (e.g. SO/2526/00001) | Existing numbers parse karke fiscal year + sequence nikaalo |
|                 | `created_at` / `order_date`           | Current order ke liye fiscal year decide karne ke liye |

- Logic:  
  - Current fiscal year = date se calculate.  
  - `SELECT MAX(sequence) FROM orders WHERE fiscal_year = ?` (agar `fiscal_year` column ho).  
  - Ya: `SELECT order_number FROM orders WHERE order_number LIKE 'SO/2526/%' ORDER BY order_number DESC` se last number parse karke sequence = last_sequence + 1.  
- Risk: concurrency pe do requests same number le sakte hain, isliye transaction/lock ya dedicated sequence table behtar hai.

### 4.2 Order save karte waqt

| Table (example)   | Column (example) | Description |
|-------------------|------------------|-------------|
| `orders` / `sale_orders` | `order_number` | SO/2526/00001 (generated value) |
|                   | `trns_id` / `id` | Internal ID (jo abhi use ho raha hai) |
|                   | `order_date`     | Order date (fiscal year verify karne ke liye) |
|                   | `party_code` / `customer_id` | Customer link |

- Order create/submit pe **order_number** column mein generated value save karo.
- Existing APIs (e.g. existing_orders list, order_review, submit response) mein **order_number** return karo taake frontend SO/2526/00001 dikha sake.

---

## 5. Summary – API aur tables

| Requirement | Kya chahiye | Kaun sa table / API |
|-------------|-------------|----------------------|
| Next order number generate karna | Fiscal year + next sequence + format `SO/2526/00001` | **API:** Either dedicated `get_next_order_number` ya submit_order andar hi generate kare. **Table:** `order_sequences` (fiscal_year, last_sequence) ya `orders` se MAX(sequence) per fiscal year (with lock). |
| Order ke saath number save karna | Har order ke saath unique SO/FY/SEQ | **Table:** `orders` / `sale_orders` – column `order_number`. |
| Frontend ko number dikhana | Order success, list, duplicate, etc. | **API:** Submit response + existing_orders + order_review mein `order_number` return karo. |

---

## 6. Backend team ke liye short prompt

Neeche wala block aap backend / API doc ke liye copy-paste use kar sakte ho:

---

**We need Order Number in this format: `SO/2526/00001`**

- **SO** = Sale Order (fixed).
- **2526** = Fiscal year (4 digits: YY start + YY end). Fiscal year = 1 July to 30 June. Example: 1 Jul 2025 – 30 Jun 2026 = 2526; 1 Jul 2026 – 30 Jun 2027 = 2627.
- **00001** = 5-digit sequence, **reset to 00001 every new fiscal year** (1 July).

**Required:**

1. **Generate next order number** when an order is created/submitted (using current fiscal year and a per–fiscal-year sequence). Prefer a small **order_sequences** table (fiscal_year, last_sequence) with transactional increment to avoid duplicates.
2. **Store** this value in the order table (e.g. `order_number`).
3. **Return** `order_number` in:
   - Submit order response
   - Existing orders list
   - Order review / order summary (so UI can show SO/2526/00001 everywhere).

**No new API is strictly required if** the existing order create/submit API is extended to generate and return `order_number` in this format and persist it in the orders table. Optionally, a separate **get next order number** endpoint can be added if we need the number before submitting the order.

---
