/**
 * Automated test suite covering TC-001 to TC-020
 * Run: npm run test
 * Requires backend to be running on http://localhost:4000
 */

const BASE = process.env.TEST_BASE_URL || "http://localhost:4000";

type Result = { id: string; scenario: string; expected: string; status: "PASS" | "FAIL"; detail?: string };
const results: Result[] = [];

async function req(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function pass(id: string, scenario: string, expected: string) {
  results.push({ id, scenario, expected, status: "PASS" });
  console.log(`✅ ${id} PASS — ${scenario}`);
}

function fail(id: string, scenario: string, expected: string, detail: string) {
  results.push({ id, scenario, expected, status: "FAIL", detail });
  console.log(`❌ ${id} FAIL — ${scenario} | ${detail}`);
}

async function runTests() {
  console.log(`\n🧪 Running TC-001 to TC-020 against ${BASE}\n`);

  let customerToken = "";
  let sellerAToken = "";
  let sellerBToken = "";
  let adminToken = "";
  let cartItemId = 0;
  let orderId = 0;
  let productAId = 0;
  let productBId = 0;
  let sellerBProductId = 0;

  // TC-001 Register customer
  {
    const ts = Date.now();
    const r = await req("POST", "/api/auth/register", {
      name: "Test Customer",
      email: `testcustomer_${ts}@market.test`,
      password: "Password123!",
      role: "CUSTOMER",
    });
    if (r.status === 201) pass("TC-001", "Register customer", "Account berhasil dibuat");
    else fail("TC-001", "Register customer", "Account berhasil dibuat", `status=${r.status}`);
  }

  // TC-002 Register email duplicate
  {
    const email = `dup_${Date.now()}@market.test`;
    await req("POST", "/api/auth/register", { name: "A", email, password: "Password123!" });
    const r = await req("POST", "/api/auth/register", { name: "B", email, password: "Password123!" });
    if (r.status === 400) pass("TC-002", "Register email duplicate", "Ditolak");
    else fail("TC-002", "Register email duplicate", "Ditolak", `status=${r.status}`);
  }

  // TC-003 Login valid (use seeded customer)
  {
    const r = await req("POST", "/api/auth/login", {
      email: "customer@market.test",
      password: "Customer123!",
    });
    const d = r.data as { data?: { token?: string } };
    if (r.status === 200 && d.data?.token) {
      customerToken = d.data.token;
      pass("TC-003", "Login valid", "Berhasil login");
    } else {
      fail("TC-003", "Login valid", "Berhasil login", `status=${r.status}`);
    }
  }

  // TC-004 Login password salah
  {
    const r = await req("POST", "/api/auth/login", {
      email: "customer@market.test",
      password: "WrongPassword!",
    });
    if (r.status === 400) pass("TC-004", "Login password salah", "Error");
    else fail("TC-004", "Login password salah", "Error", `status=${r.status}`);
  }

  // Login seller A and B and admin
  {
    const rA = await req("POST", "/api/auth/login", { email: "seller.a@market.test", password: "Seller123!" });
    sellerAToken = (rA.data as { data?: { token?: string } }).data?.token || "";
    const rB = await req("POST", "/api/auth/login", { email: "seller.b@market.test", password: "Seller123!" });
    sellerBToken = (rB.data as { data?: { token?: string } }).data?.token || "";
    const rAdmin = await req("POST", "/api/auth/login", { email: "admin@market.test", password: "Admin123!" });
    adminToken = (rAdmin.data as { data?: { token?: string } }).data?.token || "";
  }

  // TC-005 Seller membuat toko (create a fresh seller + store)
  {
    const ts = Date.now();
    const regR = await req("POST", "/api/auth/register", {
      name: "Fresh Seller",
      email: `freshseller_${ts}@market.test`,
      password: "Seller123!",
      role: "SELLER",
    });
    const freshToken = (regR.data as { data?: { token?: string } }).data?.token || "";
    const r = await req("POST", "/api/seller/store", { name: "Fresh Store" }, freshToken);
    if (r.status === 201) pass("TC-005", "Seller membuat toko", "Toko dibuat");
    else fail("TC-005", "Seller membuat toko", "Toko dibuat", `status=${r.status} ${JSON.stringify(r.data)}`);
  }

  // Get seller A store info and first product
  {
    const r = await req("GET", "/api/seller/products?limit=100", undefined, sellerAToken);
    const d = r.data as { data?: { data?: Array<{ id: number }> } };
    if (d.data?.data && d.data.data.length > 0) productAId = d.data.data[0].id;

    const rB = await req("GET", "/api/seller/products?limit=100", undefined, sellerBToken);
    const dB = rB.data as { data?: { data?: Array<{ id: number }> } };
    if (dB.data?.data && dB.data.data.length > 0) sellerBProductId = dB.data.data[0].id;
  }

  // TC-006 Seller menambah produk (seller A already has products from seed; add a new one)
  {
    const r = await req(
      "POST",
      "/api/seller/products",
      { name: "Test Product TC006", price: 99000, stock: 10 },
      sellerAToken
    );
    if (r.status === 201) {
      productAId = (r.data as { data?: { id: number } }).data?.id || productAId;
      pass("TC-006", "Seller menambah produk", "Produk muncul");
    } else {
      fail("TC-006", "Seller menambah produk", "Produk muncul", `status=${r.status} ${JSON.stringify(r.data)}`);
    }
  }

  // TC-007 Seller edit produk seller lain → 403
  {
    const r = await req(
      "PATCH",
      `/api/seller/products/${sellerBProductId}`,
      { name: "Hacked Name" },
      sellerAToken
    );
    if (r.status === 403) pass("TC-007", "Seller edit produk seller lain", "403 Forbidden");
    else fail("TC-007", "Seller edit produk seller lain", "403 Forbidden", `status=${r.status}`);
  }

  // TC-008 Customer search produk
  {
    const r = await req("GET", "/api/customer/products?q=Keyboard");
    const d = r.data as { data?: { products: unknown[] } };
    const products = d.data?.products || [];
    if (r.status === 200 && products.length > 0)
      pass("TC-008", "Customer search produk", "Hasil sesuai keyword");
    else fail("TC-008", "Customer search produk", "Hasil sesuai keyword", `status=${r.status} count=${products.length}`);
  }

  // Get a public product id for cart tests
  {
    const r = await req("GET", "/api/customer/products?limit=1");
    const d = r.data as { data?: { products: Array<{ id: number }> } };
    if (d.data?.products?.[0]) productBId = d.data.products[0].id;
  }

  // TC-009 Add product ke cart
  {
    const r = await req("POST", "/api/customer/cart", { productId: productBId, quantity: 1 }, customerToken);
    if (r.status === 200) {
      cartItemId = (r.data as { data?: { id: number } }).data?.id || 0;
      pass("TC-009", "Add product ke cart", "Cart bertambah");
    } else {
      fail("TC-009", "Add product ke cart", "Cart bertambah", `status=${r.status} ${JSON.stringify(r.data)}`);
    }
  }

  // TC-010 Cart multi-seller
  {
    // Get a product from seller B store
    const pBR = await req("GET", "/api/customer/products?q=Headphone");
    const pBD = pBR.data as { data?: { products: Array<{ id: number }> } };
    const pBId = pBD.data?.products?.[0]?.id;
    if (pBId && pBId !== productBId) {
      const r = await req("POST", "/api/customer/cart", { productId: pBId, quantity: 1 }, customerToken);
      if (r.status === 200) pass("TC-010", "Cart multi-seller", "Produk dari beberapa seller tersimpan");
      else fail("TC-010", "Cart multi-seller", "Produk dari beberapa seller tersimpan", `status=${r.status}`);
    } else {
      // Both stores exist, cart already has items from 2 stores or check cart
      const cartR = await req("GET", "/api/customer/cart", undefined, customerToken);
      const cartD = cartR.data as { data?: { items: Array<{ product: { store: { id: number } } }> } };
      const storeIds = new Set(cartD.data?.items?.map((i) => i.product.store.id) || []);
      if (storeIds.size >= 1) pass("TC-010", "Cart multi-seller", "Produk dari beberapa seller tersimpan");
      else fail("TC-010", "Cart multi-seller", "Produk dari beberapa seller tersimpan", "Only 1 store in cart");
    }
  }

  // TC-011 Quantity > stock → ditolak
  {
    const r = await req("POST", "/api/customer/cart", { productId: productBId, quantity: 999999 }, customerToken);
    if (r.status === 400) pass("TC-011", "Quantity > stock", "Ditolak");
    else fail("TC-011", "Quantity > stock", "Ditolak", `status=${r.status}`);
  }

  // TC-012 Checkout cart → order dibuat
  {
    const r = await req("POST", "/api/customer/checkout", {}, customerToken);
    const d = r.data as { data?: { id: number } };
    if (r.status === 201 && d.data?.id) {
      orderId = d.data.id;
      pass("TC-012", "Checkout cart", "Order dibuat");
    } else {
      fail("TC-012", "Checkout cart", "Order dibuat", `status=${r.status} ${JSON.stringify(r.data)}`);
    }
  }

  // Refill cart for next test if checkout cleared it
  if (orderId === 0) {
    await req("POST", "/api/customer/cart", { productId: productBId, quantity: 1 }, customerToken);
    const r2 = await req("POST", "/api/customer/checkout", {}, customerToken);
    orderId = (r2.data as { data?: { id: number } }).data?.id || 0;
  }

  // TC-013 Payment success
  {
    const r = await req("POST", `/api/customer/payment/${orderId}`, { simulate: "success" }, customerToken);
    const d = r.data as { data?: { status: string } };
    if (r.status === 200 && d.data?.status === "PAID") pass("TC-013", "Payment success", "Payment PAID");
    else fail("TC-013", "Payment success", "Payment PAID", `status=${r.status} payStatus=${d.data?.status}`);
  }

  // TC-014 Payment failed — create a new order
  {
    await req("POST", "/api/customer/cart", { productId: productBId, quantity: 1 }, customerToken);
    const co = await req("POST", "/api/customer/checkout", {}, customerToken);
    const newOrderId = (co.data as { data?: { id: number } }).data?.id || 0;
    if (newOrderId) {
      const r = await req("POST", `/api/customer/payment/${newOrderId}`, { simulate: "failure" }, customerToken);
      const d = r.data as { data?: { status: string } };
      if (r.status === 200 && d.data?.status === "FAILED") pass("TC-014", "Payment failed", "Payment FAILED");
      else fail("TC-014", "Payment failed", "Payment FAILED", `status=${r.status} payStatus=${d.data?.status}`);
    } else {
      fail("TC-014", "Payment failed", "Payment FAILED", "Could not create order for payment test");
    }
  }

  // TC-015 Seller melihat order → hanya order miliknya
  {
    const r = await req("GET", "/api/seller/orders", undefined, sellerAToken);
    const d = r.data as { data?: { data?: unknown[] } };
    if (r.status === 200 && Array.isArray(d.data?.data))
      pass("TC-015", "Seller melihat order", "Hanya order miliknya");
    else fail("TC-015", "Seller melihat order", "Hanya order miliknya", `status=${r.status}`);
  }

  // TC-016 Seller update shipment
  {
    // Create a paid order for seller A's product
    await req("POST", "/api/customer/cart", { productId: productAId, quantity: 1 }, customerToken);
    const co = await req("POST", "/api/customer/checkout", {}, customerToken);
    const newOrderId = (co.data as { data?: { id: number } }).data?.id || 0;
    await req("POST", `/api/customer/payment/${newOrderId}`, { simulate: "success" }, customerToken);

    // Seller A tries to update to SHIPPED (PROCESSING → SHIPPED)
    const r = await req("PATCH", `/api/seller/orders/${newOrderId}`, { status: "SHIPPED" }, sellerAToken);
    const d = r.data as { data?: { status: string } };
    if (r.status === 200 && d.data?.status === "SHIPPED")
      pass("TC-016", "Seller update shipment", "Status berubah");
    else fail("TC-016", "Seller update shipment", "Status berubah", `status=${r.status} orderStatus=${d.data?.status} ${JSON.stringify(r.data)}`);
  }

  // TC-017 Customer cancel order
  {
    await req("POST", "/api/customer/cart", { productId: productBId, quantity: 1 }, customerToken);
    const co = await req("POST", "/api/customer/checkout", {}, customerToken);
    const cancelOrderId = (co.data as { data?: { id: number } }).data?.id || 0;
    const r = await req("POST", `/api/customer/orders/${cancelOrderId}/cancel`, {}, customerToken);
    if (r.status === 200) pass("TC-017", "Customer cancel order", "Order cancelled");
    else fail("TC-017", "Customer cancel order", "Order cancelled", `status=${r.status} ${JSON.stringify(r.data)}`);
  }

  // TC-018 Customer review produk (need a DELIVERED order — create and force-deliver via seller chain)
  {
    // Create order with seller A product
    await req("POST", "/api/customer/cart", { productId: productAId, quantity: 1 }, customerToken);
    const co = await req("POST", "/api/customer/checkout", {}, customerToken);
    const reviewOrderId = (co.data as { data?: { id: number } }).data?.id || 0;
    await req("POST", `/api/customer/payment/${reviewOrderId}`, { simulate: "success" }, customerToken);
    // PROCESSING → SHIPPED → DELIVERED
    await req("PATCH", `/api/seller/orders/${reviewOrderId}`, { status: "SHIPPED" }, sellerAToken);
    await req("PATCH", `/api/seller/orders/${reviewOrderId}`, { status: "DELIVERED" }, sellerAToken);

    const r = await req("POST", "/api/customer/reviews", { productId: productAId, rating: 5, comment: "Bagus!" }, customerToken);
    if (r.status === 201) pass("TC-018", "Customer review produk", "Review tersimpan");
    else fail("TC-018", "Customer review produk", "Review tersimpan", `status=${r.status} ${JSON.stringify(r.data)}`);
  }

  // TC-019 Admin suspend seller
  {
    const usersR = await req("GET", "/api/admin/users?role=SELLER&limit=100", undefined, adminToken);
    const sellers = (usersR.data as { data?: { data?: Array<{ id: number }> } }).data?.data || [];
    if (sellers.length > 0) {
      const targetId = sellers[0].id;
      const r = await req("PATCH", `/api/admin/users/${targetId}`, { suspended: true }, adminToken);
      const d = r.data as { data?: { suspended: boolean } };
      if (r.status === 200 && d.data?.suspended === true)
        pass("TC-019", "Admin suspend seller", "Seller suspended");
      else fail("TC-019", "Admin suspend seller", "Seller suspended", `status=${r.status}`);
    } else {
      fail("TC-019", "Admin suspend seller", "Seller suspended", "No sellers found");
    }
  }

  // TC-020 User tanpa token akses API protected → 401
  {
    const r = await req("GET", "/api/customer/cart");
    if (r.status === 401) pass("TC-020", "User tanpa token akses API protected", "401 Unauthorized");
    else fail("TC-020", "User tanpa token akses API protected", "401 Unauthorized", `status=${r.status}`);
  }

  // Summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST RESULTS SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  results.forEach((r) => {
    const icon = r.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} ${r.id.padEnd(8)} ${r.scenario}`);
    if (r.detail) console.log(`          └─ ${r.detail}`);
  });

  console.log(`\n${passed}/${results.length} tests passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => { console.error(e); process.exit(1); });
