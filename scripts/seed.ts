import { PrismaClient, Role, StoreStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

// ── Product catalog with reliable picsum images ──
const PRODUCTS = [
  // Keyboards
  { name: "Mechanical Keyboard TKL",    cat: "keyboard", price: 850000,  stock: 20,  img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop&q=80", desc: "Cherry MX Red switches, TKL layout, full RGB backlight." },
  { name: "Wireless Keyboard Slim",     cat: "keyboard", price: 350000,  stock: 18,  img: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&h=500&fit=crop&q=80", desc: "Bluetooth 5.0, baterai 6 bulan, multi-device 3 perangkat." },
  { name: "Gaming Keyboard RGB 60%",    cat: "keyboard", price: 620000,  stock: 14,  img: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500&h=500&fit=crop&q=80", desc: "60% compact layout, hot-swap switches, per-key RGB." },
  { name: "Keyboard Membrane Office",   cat: "keyboard", price: 125000,  stock: 45,  img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop&q=80", desc: "Silent membrane keyboard, ergonomic design, USB plug-and-play." },
  { name: "Keyboard Numpad Standalone", cat: "keyboard", price: 95000,   stock: 30,  img: "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=500&h=500&fit=crop&q=80", desc: "Standalone numpad 19 keys, plug-and-play, slim aluminium." },

  // Mouse
  { name: "Gaming Mouse 16000 DPI",  cat: "mouse", price: 450000, stock: 35, img: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop&q=80", desc: "16000 DPI, RGB, 7 programmable buttons, 70g ultra-light." },
  { name: "Wireless Mouse Ergonomic",cat: "mouse", price: 280000, stock: 40, img: "https://images.unsplash.com/photo-1605773527852-c546a8584ea3?w=500&h=500&fit=crop&q=80", desc: "2.4GHz wireless, ergonomic shape, 12 bulan baterai AAA." },
  { name: "Trackball Mouse Pro",     cat: "mouse", price: 520000, stock: 12, img: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=500&h=500&fit=crop&q=80", desc: "Trackball 55mm, DPI 400-2000, cocok untuk desainer grafis." },
  { name: "Mouse Bluetooth Slim",    cat: "mouse", price: 190000, stock: 28, img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&h=500&fit=crop&q=80", desc: "Ultra-slim Bluetooth mouse, silent click, kompatibel MacOS/Windows." },

  // Headphones & Audio
  { name: "Headphone Studio 250ohm",      cat: "audio", price: 1200000, stock: 15, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop&q=80", desc: "40mm drivers, 250 ohm, suara flat untuk mixing profesional." },
  { name: "Gaming Headset 7.1 Surround",  cat: "audio", price: 750000,  stock: 22, img: "https://images.unsplash.com/photo-1599669454699-248893623440?w=500&h=500&fit=crop&q=80", desc: "7.1 virtual surround, mic flip-to-mute, RGB earcup." },
  { name: "Earbuds TWS Pro ANC",          cat: "audio", price: 580000,  stock: 30, img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop&q=80", desc: "Active noise cancelling, latensi 40ms, IPX5, 30 jam total." },
  { name: "Bluetooth Speaker Portable",   cat: "audio", price: 420000,  stock: 25, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop&q=80", desc: "360° sound, IPX7 waterproof, 24 jam playtime, TWS stereo pair." },
  { name: "Microphone Condenser USB",     cat: "audio", price: 750000,  stock: 12, img: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=500&h=500&fit=crop&q=80", desc: "Cardioid pattern, 192kHz/24bit, plug-and-play, cocok podcast." },
  { name: "Soundbar Desktop 2.0",         cat: "audio", price: 680000,  stock: 18, img: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&h=500&fit=crop&q=80", desc: "40W RMS, Bluetooth 5.0 + AUX, DSP surround virtual." },

  // Monitors & Display
  { name: "Monitor 27\" 144Hz QHD",  cat: "monitor", price: 4500000, stock: 10, img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop&q=80", desc: "IPS 1440p 144Hz, 1ms, HDR400, HDMI 2.0 + DP 1.4." },
  { name: "Monitor 24\" FHD 165Hz",  cat: "monitor", price: 2800000, stock: 14, img: "https://images.unsplash.com/photo-1593640408182-31c228b0a67b?w=500&h=500&fit=crop&q=80", desc: "IPS 1080p 165Hz, 1ms GTG, G-Sync Compatible, frameless." },
  { name: "Monitor Ultrawide 34\"",  cat: "monitor", price: 6200000, stock: 6,  img: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500&h=500&fit=crop&q=80", desc: "34\" 21:9 UWQHD 100Hz, curved VA, HDR400, USB-C 65W." },
  { name: "Monitor Portable 15.6\"", cat: "monitor", price: 1850000, stock: 20, img: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&h=500&fit=crop&q=80", desc: "FHD IPS touchscreen, USB-C, cover keyboard terintegrasi." },

  // Webcam
  { name: "Webcam 1080p 60fps",    cat: "webcam", price: 650000,  stock: 25, img: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=500&h=500&fit=crop&q=80", desc: "Autofocus, noise-cancelling mic, plug-and-play, cover privacy." },
  { name: "Webcam 4K AI Tracking", cat: "webcam", price: 1450000, stock: 8,  img: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=500&h=500&fit=crop&q=80", desc: "4K 30fps, AI face tracking, wide FOV 90°, dual stereo mic." },

  // USB & Accessories
  { name: "USB Hub 7-Port 3.0",     cat: "usb", price: 175000, stock: 50, img: "https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=500&h=500&fit=crop&q=80", desc: "7 port USB 3.0, power adapter 5V, transfer 5Gbps." },
  { name: "USB-C Docking Station",  cat: "usb", price: 580000, stock: 15, img: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=500&fit=crop&q=80", desc: "12-in-1 dock, 4K HDMI, 100W PD, SD/TF card, USB 3.0 x4." },
  { name: "Cable Management Kit",   cat: "usb", price: 65000,  stock: 80, img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop&q=80", desc: "Kabel tie 100pcs + velcro 10pcs + cable clips 20pcs." },

  // Desk Accessories
  { name: "Mousepad XL Gaming 900mm", cat: "desk", price: 120000, stock: 40, img: "https://images.unsplash.com/photo-1616499370260-485b3e5ed653?w=500&h=500&fit=crop&q=80", desc: "900×400mm, anti-slip rubber base, stitched edges, water-resistant." },
  { name: "Laptop Stand Aluminium",   cat: "desk", price: 280000, stock: 30, img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&h=500&fit=crop&q=80", desc: "Adjustable angle 15-80°, kompatibel 10-17\", ultra-portable." },
  { name: "Monitor Arm Dual",         cat: "desk", price: 420000, stock: 10, img: "https://images.unsplash.com/photo-1593642533144-3d62aa4783ec?w=500&h=500&fit=crop&q=80", desc: "Dual monitor arm VESA 75/100, rotation 360°, max 9kg/arm." },
  { name: "Desk Organizer Premium",   cat: "desk", price: 185000, stock: 35, img: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&h=500&fit=crop&q=80", desc: "5 kompartemen, holder hp + pen + kartu, aluminium anodized." },
  { name: "LED Desk Lamp USB-C",      cat: "desk", price: 245000, stock: 22, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&q=80", desc: "5 color temp + 10 brightness level, wireless charger base, USB-A." },
  { name: "Wrist Rest Keyboard",      cat: "desk", price: 95000,  stock: 45, img: "https://images.unsplash.com/photo-1593642533144-3d62aa4783ec?w=500&h=500&fit=crop&q=80", desc: "Memory foam, anti-slip base, washable cover, 430mm." },

  // Phone & Mobile
  { name: "Smartphone Stand Adjustable", cat: "mobile", price: 85000,  stock: 60, img: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&h=500&fit=crop&q=80", desc: "360° rotasi, kompatibel 4-7\", anti-slip silicone, foldable." },
  { name: "Wireless Charger 15W Pad",   cat: "mobile", price: 175000, stock: 35, img: "https://images.unsplash.com/photo-1586495777744-4e6fdef864a8?w=500&h=500&fit=crop&q=80", desc: "Qi 15W fast charge, LED indicator, anti-slip, slim 5mm." },
  { name: "Power Bank 20000mAh",        cat: "mobile", price: 320000, stock: 28, img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop&q=80", desc: "20000mAh, 65W PD, charge 3 devices simultaneously, LCD display." },
  { name: "Phone Ring Light 6\"",       cat: "mobile", price: 145000, stock: 40, img: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&h=500&fit=crop&q=80", desc: "6\" ring light clip-on, 3 color temp, dimmer, universal clip." },

  // Networking
  { name: "WiFi Router AX3000",    cat: "network", price: 850000, stock: 12,  img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&h=500&fit=crop&q=80", desc: "WiFi 6 AX3000, dual band, 4 antena, coverage 200m², MU-MIMO." },
  { name: "Network Switch 8-Port", cat: "network", price: 220000, stock: 18,  img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&h=500&fit=crop&q=80", desc: "Gigabit 8-port unmanaged switch, plug-and-play, fanless." },
  { name: "Ethernet Cable Cat6 10m",cat: "network", price: 55000,  stock: 100, img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&h=500&fit=crop&q=80", desc: "Cat6 flat cable 10 meter, 1Gbps, gold-plated RJ45." },

  // Storage
  { name: "SSD Eksternal 1TB USB-C",   cat: "storage", price: 1250000, stock: 16, img: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&h=500&fit=crop&q=80", desc: "NVMe 1TB, 1000MB/s read, shock-proof, pocket-sized." },
  { name: "Flash Drive 128GB USB 3.2", cat: "storage", price: 145000,  stock: 60, img: "https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?w=500&h=500&fit=crop&q=80", desc: "USB 3.2 Gen1, 400MB/s read, metal housing, cap-less design." },
  { name: "SD Card 256GB V30",         cat: "storage", price: 280000,  stock: 40, img: "https://images.unsplash.com/photo-1566159960676-c73f14f75e14?w=500&h=500&fit=crop&q=80", desc: "V30 A2 UHS-I, 180MB/s read, cocok untuk kamera mirrorless & drone." },

  // Cooling
  { name: "Laptop Cooling Pad RGB",  cat: "cooling", price: 185000, stock: 25, img: "https://images.unsplash.com/photo-1593640408182-31c228b0a67b?w=500&h=500&fit=crop&q=80", desc: "6 fan quiet 1200RPM, RGB, adjustable height, USB powered." },
  { name: "CPU Cooler 240mm AIO",    cat: "cooling", price: 780000, stock: 8,  img: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&h=500&fit=crop&q=80", desc: "240mm liquid cooler, ARGB pump + fan, compatible AMD & Intel." },

  // Cables
  { name: "HDMI Cable 2.0 3m 4K", cat: "cable", price: 75000, stock: 90, img: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=500&fit=crop&q=80", desc: "HDMI 2.0 4K@60Hz, braided nylon, 3 meter, gold-plated." },
  { name: "USB-C to USB-C 100W",  cat: "cable", price: 85000, stock: 75, img: "https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=500&h=500&fit=crop&q=80", desc: "100W PD, 480Mbps data, 1.5m braided, E-marker chip." },

  // Gaming
  { name: "Gaming Chair Pro",         cat: "gaming", price: 3200000, stock: 7,  img: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=500&h=500&fit=crop&q=80", desc: "Kursi gaming ergonomis, lumbar support, arm rest 4D, recline 180°." },
  { name: "Controller Gamepad Wireless",cat:"gaming", price: 480000,  stock: 20, img: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&h=500&fit=crop&q=80", desc: "Wireless gamepad 2.4GHz, haptic feedback, 20 jam baterai, PC+Android." },
  { name: "VR Headset Standalone",    cat: "gaming", price: 5500000, stock: 4,  img: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=500&h=500&fit=crop&q=80", desc: "Standalone VR 6DoF, resolusi 2K per-eye, 90Hz refresh, 64GB storage." },
];

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clear all ──
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin ──
  const admin = await prisma.user.create({
    data: { name: "Admin TokoKita", email: "admin@market.test", password: hash("Admin123!"), role: Role.ADMIN },
  });

  // ── Sellers ──
  const sellers = await Promise.all([
    prisma.user.create({ data: { name: "Budi Santoso", email: "seller.a@market.test", password: hash("Seller123!"), role: Role.SELLER } }),
    prisma.user.create({ data: { name: "Rina Wijaya", email: "seller.b@market.test", password: hash("Seller123!"), role: Role.SELLER } }),
    prisma.user.create({ data: { name: "Agus Pratama", email: "seller.c@market.test", password: hash("Seller123!"), role: Role.SELLER } }),
    prisma.user.create({ data: { name: "Dewi Kusuma", email: "seller.d@market.test", password: hash("Seller123!"), role: Role.SELLER } }),
  ]);

  // ── Customers ──
  const customers = await Promise.all([
    prisma.user.create({ data: { name: "Customer Demo", email: "customer@market.test", password: hash("Customer123!"), role: Role.CUSTOMER } }),
    prisma.user.create({ data: { name: "Ahmad Fauzi", email: "ahmad@market.test", password: hash("Customer123!"), role: Role.CUSTOMER } }),
    prisma.user.create({ data: { name: "Siti Rahayu", email: "siti@market.test", password: hash("Customer123!"), role: Role.CUSTOMER } }),
    prisma.user.create({ data: { name: "Rizky Maulana", email: "rizky@market.test", password: hash("Customer123!"), role: Role.CUSTOMER } }),
    prisma.user.create({ data: { name: "Maya Sari", email: "maya@market.test", password: hash("Customer123!"), role: Role.CUSTOMER } }),
  ]);

  // ── Create cart + address for each customer ──
  const cities     = ["Jakarta","Bandung","Surabaya","Medan","Yogyakarta"];
  const provinces  = ["DKI Jakarta","Jawa Barat","Jawa Timur","Sumatera Utara","DI Yogyakarta"];
  const postcodes  = ["10110","40111","60111","20111","55111"];
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    await prisma.cart.create({ data: { userId: c.id } });
    await prisma.address.create({
      data: {
        userId: c.id, label: "Rumah", isDefault: true,
        street: `Jl. Contoh No. ${i + 1}`,
        city: cities[i],
        province: provinces[i],
        postalCode: postcodes[i],
      },
    });
  }

  // ── Stores ──
  const STORE_DEFS = [
    { seller: sellers[0], name: "TechZone Official", desc: "Keyboard, mouse, dan aksesoris gaming terlengkap" },
    { seller: sellers[1], name: "AudioVisual Pro",   desc: "Headphone, speaker, webcam, dan monitor premium" },
    { seller: sellers[2], name: "GadgetHub Store",   desc: "Aksesoris mobile, charger, dan storage device" },
    { seller: sellers[3], name: "DeskSetup Studio",  desc: "Perlengkapan desk setup aesthetic dan ergonomis" },
  ];

  const stores = await Promise.all(
    STORE_DEFS.map(s =>
      prisma.store.create({
        data: { sellerId: s.seller.id, name: s.name, description: s.desc, status: StoreStatus.APPROVED },
      })
    )
  );

  // ── Distribute products across 4 stores ──
  const storeAssign = [
    // TechZone: keyboard, mouse, network
    ["keyboard","mouse","network","cooling","cable"],
    // AudioVisual: audio, monitor, webcam
    ["audio","monitor","webcam"],
    // GadgetHub: mobile, usb, storage
    ["mobile","usb","storage"],
    // DeskSetup: desk, gaming
    ["desk","gaming"],
  ];

  const allProducts: typeof PRODUCTS = [];
  for (const [si, cats] of storeAssign.entries()) {
    const storeProds = PRODUCTS.filter(p => cats.includes(p.cat));
    for (const p of storeProds) {
      await prisma.product.create({
        data: {
          storeId: stores[si].id,
          name: p.name,
          description: p.desc,
          price: p.price,
          stock: p.stock,
          imageUrl: p.img,
        },
      });
      allProducts.push(p);
    }
  }

  // ── Create some completed orders with items for report data ──
  const dbProducts = await prisma.product.findMany({ take: 20 });

  for (const customer of customers) {
    // 3-5 orders per customer
    const numOrders = 3 + Math.floor(Math.random() * 3);
    for (let oi = 0; oi < numOrders; oi++) {
      // pick 1-3 random products
      const numItems = 1 + Math.floor(Math.random() * 3);
      const picks = dbProducts.sort(() => 0.5 - Math.random()).slice(0, numItems);

      const total = picks.reduce((s, p) => s + Number(p.price), 0) + 10000;
      const statuses: OrderStatus[] = ["DELIVERED","DELIVERED","DELIVERED","CANCELLED","PROCESSING"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const order = await prisma.order.create({
        data: {
          userId: customer.id,
          total,
          shippingFee: 10000,
          status,
          items: {
            create: picks.map(p => ({
              productId: p.id,
              storeId: p.storeId,
              quantity: 1,
              price: p.price,
            })),
          },
        },
      });

      const payStatus: PaymentStatus = status === "CANCELLED" ? "FAILED" : "PAID";
      await prisma.payment.create({
        data: { orderId: order.id, amount: total, status: payStatus },
      });
    }
  }

  // ── Reviews for delivered orders ──
  const deliveredItems = await prisma.orderItem.findMany({
    where: { order: { status: "DELIVERED" } },
    include: { order: true },
    take: 30,
  });

  const reviewed = new Set<string>();
  const reviewTexts = [
    "Produk bagus, sesuai deskripsi, pengiriman cepat!",
    "Kualitas oke, harga terjangkau, recommended seller.",
    "Barang original, packing aman, bintang 5!",
    "Lumayan bagus, tapi agak lama pengirimannya.",
    "Sangat puas! Kualitas premium dengan harga bersaing.",
    "Produk sesuai gambar, seller responsif, mantap.",
    "Sudah pakai 2 minggu, masih bagus. Worth it!",
    "Oke sih, sesuai ekspektasi. Akan beli lagi.",
  ];

  for (const item of deliveredItems) {
    const key = `${item.order.userId}-${item.productId}`;
    if (reviewed.has(key)) continue;
    reviewed.add(key);
    await prisma.review.create({
      data: {
        userId: item.order.userId,
        productId: item.productId,
        rating: 3 + Math.floor(Math.random() * 3), // 3-5
        comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
      },
    }).catch(() => {}); // skip unique constraint errors
  }

  // ── Summary ──
  const [pCount, uCount, oCount, rCount] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.review.count(),
  ]);

  console.log("✅ Seed complete!");
  console.log(`   👤 Users:    ${uCount} (1 admin, 4 seller, 5 customer)`);
  console.log(`   🏪 Stores:   ${stores.length}`);
  console.log(`   📦 Products: ${pCount}`);
  console.log(`   🛒 Orders:   ${oCount}`);
  console.log(`   ⭐ Reviews:  ${rCount}`);
  console.log("\n   Demo accounts:");
  console.log(`   admin@market.test      / Admin123!`);
  console.log(`   seller.a@market.test   / Seller123!`);
  console.log(`   seller.b@market.test   / Seller123!`);
  console.log(`   customer@market.test   / Customer123!`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
