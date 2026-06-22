import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetSequences() {
  const tables = [
    { table: "admins", column: "admin_id", next: 3 },
    { table: "adminauth", column: "auth_id", next: 8 },
    { table: "users", column: "user_id", next: 20 },
    { table: "auth", column: "auth_id", next: 21 },
    { table: "user_addresses", column: "address_id", next: 7 },
    { table: "products", column: "product_id", next: 9 },
    { table: "favorites", column: "favorite_id", next: 4 },
    { table: "orders", column: "order_id", next: 14 },
    { table: "order_items", column: "item_id", next: 16 },
  ];

  for (const { table, column, next } of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', '${column}'), ${next}, false)`,
    );
  }
}

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.auth.deleteMany();
  await prisma.adminAuth.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();

  await prisma.admin.createMany({
    data: [
      {
        id: 1,
        username: "admin",
        passwordHash:
          "$2b$12$dUfYxvuPSnQUv9V65xNNrOvyMlSL7yIs/oLAdC50BUfkesaNeavWu",
        email: "admin@gmail.com",
        role: "superadmin",
        lastLogin: new Date("2026-06-21T01:11:40.000Z"),
        createdAt: new Date("2026-06-19T11:11:55.000Z"),
        updatedAt: new Date("2026-06-20T17:11:40.000Z"),
      },
      {
        id: 2,
        username: "staff01",
        passwordHash:
          "$2b$12$9TRtmj22K8gYwGz224jt5ebjb8odR6I5cgO5wMyUeiiegIFacO2k2",
        email: "staff01@gmail.com",
        role: "staff",
        createdAt: new Date("2026-06-19T11:18:54.000Z"),
        updatedAt: new Date("2026-06-19T11:18:54.000Z"),
      },
    ],
  });

  await prisma.adminAuth.createMany({
    data: [
      {
        id: 6,
        adminId: 1,
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6MSwicm9sZSI6InN1cGVyYWRtaW4iLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3ODE5NzA5NjQsImV4cCI6MTc4MTk5OTc2NH0.ZE8ygd1RmX3EfQAYHwAvwD3QawMUSlBw844UkkDZmOU",
        expiresAt: new Date("2026-06-21T07:56:04.000Z"),
        lastLogin: new Date("2026-06-20T23:56:04.000Z"),
      },
      {
        id: 7,
        adminId: 1,
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6MSwicm9sZSI6InN1cGVyYWRtaW4iLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3ODE5NzU1MDAsImV4cCI6MTc4MjAwNDMwMH0.I_4Nng_Xl3trsNDwE3QCtjnBQ_MCadq3jmu9nAr7TwQ",
        expiresAt: new Date("2026-06-21T09:11:40.000Z"),
        lastLogin: new Date("2026-06-21T01:11:40.000Z"),
      },
    ],
  });

  await prisma.user.createMany({
    data: [
      {
        id: 14,
        memberId: "LKBM-FMWOVRW",
        firstName: "New",
        lastName: "Reg",
        name: "New Reg",
        email: "newreg2138210068@test.local",
        passwordHash:
          "$2b$12$si7Xw61jFoD1jGTwLp52t.mGPGumtmd.0UXyBxaUV/JdAQ6XkrPoO",
        status: "active",
        country: "",
        address1: "",
        createdAt: new Date("2026-06-20T16:55:31.000Z"),
        updatedAt: new Date("2026-06-20T16:55:31.000Z"),
      },
      {
        id: 19,
        memberId: "LKBM-9TAU9AY",
        firstName: "P",
        lastName: "C",
        name: "P C",
        email: "pc@gmail.com",
        passwordHash:
          "$2b$12$e5HtaKrEXI/Py5qi2Amv5OLfrUZgVRKiwwRArfiui4BcvYTHGd.lO",
        status: "active",
        phone: "+852912345678",
        country: "",
        address1: "",
        createdAt: new Date("2026-06-20T17:06:28.000Z"),
        updatedAt: new Date("2026-06-20T17:07:18.000Z"),
      },
    ],
  });

  await prisma.userAddress.createMany({
    data: [
      {
        id: 5,
        userId: 19,
        recipientName: "t t",
        phone: "+852912345678",
        country: "MO",
        city: "氹仔",
        streetAddress: "golden garden",
        isDefault: false,
        createdAt: new Date("2026-06-20T17:07:51.000Z"),
      },
      {
        id: 6,
        userId: 19,
        recipientName: "P C",
        phone: "+852912345678",
        country: "HK",
        city: "西貢區",
        streetAddress: "tuen wan 11 street",
        isDefault: true,
        createdAt: new Date("2026-06-20T17:10:19.000Z"),
      },
    ],
  });

  await prisma.product.createMany({
    data: [
      {
        id: 1,
        typeId: "LKB-001",
        category: "祈願符",
        name: "祈願符 · 經典款",
        description:
          "適合：個人祈願、節日儀式、送禮祝福\n以傳統書法與簡潔符語，書寫你的願望並放入祈願盒，保留手作的溫度與儀式感。\n[ 此乃水溶符紙產品 ]",
        price: 280,
        stock: 49,
        imageUrl: "/pics/cat01.png",
        createdAt: new Date("2026-06-18T18:01:07.000Z"),
        updatedAt: new Date("2026-06-20T17:09:37.000Z"),
      },
      {
        id: 2,
        typeId: "LKB-002",
        category: "祈願符",
        name: "祈願符 · 禮盒組",
        description:
          "適合：節日贈禮、喬遷祝福、與摯愛共享儀式\n附祈願盒與水溶說明卡，適合節日贈禮或與摯愛共享儀式時刻。\n[ 此乃水溶符紙產品 ]\n*圖片只供參考",
        price: 480,
        stock: 26,
        imageUrl: "/pics/cat01.png",
        createdAt: new Date("2026-06-18T18:07:37.000Z"),
        updatedAt: new Date("2026-06-20T15:40:52.000Z"),
      },
      {
        id: 3,
        typeId: "LKB-003",
        category: "消災符",
        name: "消災符 · 居家款",
        description:
          "適合：居家擺設、門口護佑、書桌角落\n\n以天然材質與簡約符樣，為居家帶來安定與祝福，適合擺放於門口或書桌角落。\n[ 此乃水溶符紙產品 ]\n\n*圖片只供參考\n簡約符樣設計，融入現代家居\n天然材質，安心無毒\n可搭配水溶儀式釋放祝福\n附擺放與使用建議",
        price: 320,
        stock: 8,
        imageUrl: "/pics/cat02.png",
        createdAt: new Date("2026-06-18T18:08:53.000Z"),
        updatedAt: new Date("2026-06-20T15:42:45.000Z"),
      },
      {
        id: 4,
        typeId: "LKB-004",
        category: "消災符",
        name: "消災符 · 出行款",
        description:
          "適合：日常出行、旅行護佑、隨身攜帶\n\n輕巧便攜尺寸，適合放入皮夾或隨身包，為每一次出門留下安心。\n[ 此乃水溶符紙產品 ]\n\n*圖片只供參考",
        price: 260,
        stock: 9,
        imageUrl: "/pics/cat02.png",
        createdAt: new Date("2026-06-18T18:09:29.000Z"),
        updatedAt: new Date("2026-06-20T18:04:21.000Z"),
      },
      {
        id: 5,
        typeId: "LKB-005",
        category: "答案紙",
        name: "答案紙 · 補充包",
        description:
          "適合：日常書寫、冥想反思、補充使用\n\n精選紙張與印刷工藝，為思考與祈願提供一張安靜的空白，讓文字成為儀式的一部分。\n[ 此乃水溶符紙產品 ]\n\n*圖片只供參考",
        price: 180,
        stock: 16,
        imageUrl: "/pics/cat03.png",
        createdAt: new Date("2026-06-18T18:10:09.000Z"),
        updatedAt: new Date("2026-06-20T18:03:08.000Z"),
      },
      {
        id: 6,
        typeId: "LKB-006",
        category: "答案紙",
        name: "答案紙 · 入門套組",
        description:
          "適合：初次體驗、入門學習、送禮入門\n\n含答案紙、書寫筆與使用指南，適合初次體驗水溶符紙的朋友。\n[ 此乃水溶符紙產品 ]",
        price: 360,
        stock: 0,
        imageUrl: "/pics/cat03.png",
        createdAt: new Date("2026-06-18T18:10:38.000Z"),
        updatedAt: new Date("2026-06-19T09:04:16.000Z"),
      },
      {
        id: 7,
        typeId: "LKB-007",
        category: "器皿",
        name: "琉璃碗· 經典款",
        description: "適合：配搭水溶符紙產品使用，更具儀式感。",
        price: 150,
        stock: -1,
        imageUrl: "/pics/cat04.jpg",
        createdAt: new Date("2026-06-18T18:01:07.000Z"),
        updatedAt: new Date("2026-06-19T14:37:36.000Z"),
      },
    ],
  });

  await prisma.favorite.create({
    data: {
      id: 3,
      userId: 19,
      productId: 7,
      createdAt: new Date("2026-06-20T18:13:18.000Z"),
    },
  });

  await prisma.order.createMany({
    data: [
      {
        id: 11,
        userId: 19,
        guestEmail: "pc@gmail.com",
        shippingAddressId: 5,
        shippingAddressText:
          "t t · +853852912345678 · golden garden · 氹仔 · MO",
        stripePaymentId: "pi_3TkSOgJyI0wiQemU1ADzhdqH",
        shippingAddress: "",
        billingAddress:
          "P C · +852912345678 · tuen wan 1111 street · 葵青區 · HK",
        totalAmount: 310,
        paymentNo: "Luk20260621647957",
        status: "paid",
        createdAt: new Date("2026-06-20T17:09:37.000Z"),
        updatedAt: new Date("2026-06-20T17:09:37.000Z"),
      },
      {
        id: 12,
        guestName: "mary wong",
        guestEmail: "mw@gmail.com",
        guestPhone: "+85212345678",
        shippingAddressText:
          "mary wong · +85212345678 · safsadf3 55  00- 00building · 西貢區 · HK",
        stripePaymentId: "pi_3TkTESJyI0wiQemU1q4371Tt",
        shippingAddress: "",
        billingAddress:
          "mary wong · +85212345678 · safsadf3 55  00- 00building · 西貢區 · HK",
        totalAmount: 210,
        paymentNo: "Luk20260621176545",
        status: "paid",
        createdAt: new Date("2026-06-20T18:03:08.000Z"),
        updatedAt: new Date("2026-06-20T18:03:08.000Z"),
      },
      {
        id: 13,
        userId: 19,
        guestName: "P C",
        guestEmail: "pc@gmail.com",
        guestPhone: "+852912345678",
        shippingAddressId: 6,
        shippingAddressText:
          "P C · +852912345678 · tuen wan 11 street · 西貢區 · HK",
        stripePaymentId: "pi_3TkTFeJyI0wiQemU13tyZQuq",
        shippingAddress: "",
        billingAddress:
          "P C · +852912345678 · tuen wan 11 street · 西貢區 · HK",
        totalAmount: 290,
        paymentNo: "Luk20260621774010",
        status: "paid",
        createdAt: new Date("2026-06-20T18:04:21.000Z"),
        updatedAt: new Date("2026-06-20T18:04:21.000Z"),
      },
    ],
  });

  await prisma.orderItem.createMany({
    data: [
      { id: 13, orderId: 11, productId: 1, quantity: 1, price: 280 },
      { id: 14, orderId: 12, productId: 5, quantity: 1, price: 180 },
      { id: 15, orderId: 13, productId: 4, quantity: 1, price: 260 },
    ],
  });

  await resetSequences();

  console.log("Seed complete: lukibou_db.sql data imported.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
