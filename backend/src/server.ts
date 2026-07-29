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
import path from "path";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./docs/swagger.js";

const app = express();
app.use(morgan("dev"));
app.disable("etag");
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL ?? "http://localhost:5173",
      "https://app.resqplate.me",
    ],
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api-docs.json", (_req, res) => {
  return res.status(200).json(openApiDocument);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "ResQPlate API Documentation",
  }),
);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", AuthRouter);
app.use("/api/restaurants", RestaurantRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/reservations", ReservationRouter);
app.use("/api/listings", ListingRouter);
app.use("/api/pickups", PickupRouter);

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`API is listening on http://localhost:${port}`);
  console.log(`Server health is live in http://localhost:${port}/api/health`);
  console.log(`Project Docs is live in http://localhost:${port}/api-docs`);
});
