import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "lukibou-auth-api" });
});

app.use("/", authRoutes);
app.use("/", adminRoutes);
app.use("/", productRoutes);
app.use("/", orderRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "找不到此 API 路徑" });
});

app.use((error, _req, res, _next) => {
  console.error("[server error]", error);
  res.status(500).json({ error: "伺服器內部錯誤" });
});

export default app;
