// ./src/routes/index.js
import adminRouter from "./adminRoutes.js";
import authRouter from "./authRoutes.js";
import managerRouter from "./managerRoutes.js";
import tenantRouter from "./tenantRoutes.js";
import ownerRouter from "./ownerRoutes.js";
import commonRouter from "./commonRoutes.js";

export default function applyRoutes(app) {
  app.use("/api/admin", adminRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/manager", managerRouter);
  app.use("/api/tenant", tenantRouter);
  app.use("/api/owner", ownerRouter);
  app.use("/api/common", commonRouter);
}
