import express from "express";
import cors from "cors";
import AuthRouter from "./auth/auth.routes.js";
import RestaurantRouter from "./restaurants/restaurants.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Call routes in the respective modules
app.use("/api/auth", AuthRouter);
app.use("/api/restaurants", RestaurantRouter);

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Server health is in http://localhost:${port}/api/health`);
});
