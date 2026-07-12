// Added this line to test the backend deployment to VM

import express from "express";
import cors from "cors";
import AuthRouter from "./auth/auth.routes.js";
import RestaurantRouter from "./restaurants/restaurants.routes.js";
import AdminRouter from "./admin/admin.routes.js";
import morgan from "morgan";
import ReservationRouter from "./reservations/reservations.routes.js";
import ListingRouter from "./listings/listings.routes.js";
import PickupRouter from "./pickups/pickups.routes.js";

const app = express();
app.use(morgan("dev"));
app.disable("etag");
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL ?? "http://localhost:5173",
      "https://resqplate-api.luvveerlamba.workers.dev",
    ],
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
app.use("/api/admin", AdminRouter);
app.use("/api/reservations", ReservationRouter);
app.use("/api/listings", ListingRouter);
app.use("/api/pickups", PickupRouter);

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Server health is in http://localhost:${port}/api/health`);
});
