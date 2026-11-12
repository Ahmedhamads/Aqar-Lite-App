
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error-handler";
import { env } from "./config/env";
import {notFoundMiddleware} from "./middlewares/not-found.middleware";
import authRouter from "./modules/auth/auth.routes";
import unitRouter from "./modules/units/unit.routes";
import reservationRouter from "./modules/reservations/reservation.routes";
import clientRouter from "./modules/clients/client.routes";
import { auditRouter } from "./modules/audit/audit.routes";
import { contractRouter } from "./modules/contracts/contract.routes";
import { paymentRouter } from "./modules/payments/payment.routes";
import { companyRouter } from "./modules/companies/company.routes";
import { installmentRouter } from "./modules/installments/installment.routes";
import userRouter from "./modules/users/user.routes";
import dashboardRouter from "./modules/dashboard/dashboard.routes";
const app = express();

// Hide Express technology information.
app.disable("x-powered-by");

// Security HTTP headers.
app.use(helmet());

// Allow requests from the configured frontend.
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
  "Content-Type",
  "Authorization",
  "X-Request-ID",
  "X-CSRF-Token",
  "Idempotency-Key",
],
  })
);

// Parse JSON request bodies.
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded request bodies.
app.use(
  express.urlencoded({
    extended: false,
    limit: "10kb"
  })
);

// Parse cookies from incoming requests.
app.use(cookieParser());

// Temporary diagnostic route - remove after testing

// Temporary health-check endpoint.
app.get(`${env.API_PREFIX}/health`, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Aqar Lite API is running",
    data: {
      status: "healthy",
      environment: env.NODE_ENV
    }
  });
});

app.use(`${env.API_PREFIX}/auth`, authRouter);
app.use(`${env.API_PREFIX}/units`, unitRouter);
app.use(`${env.API_PREFIX}/reservations`, reservationRouter);
app.use(`${env.API_PREFIX}/clients`, clientRouter);
app.use(`${env.API_PREFIX}/audit-logs`, auditRouter);
app.use(`${env.API_PREFIX}/contracts`, contractRouter);
app.use(`${env.API_PREFIX}/companies`, companyRouter);
app.use(`${env.API_PREFIX}/payment`, paymentRouter);
app.use(`${env.API_PREFIX}/installment`, installmentRouter);
app.use(`${env.API_PREFIX}/users`, userRouter);
app.use(`${env.API_PREFIX}/dashboard`, dashboardRouter);

// 1. Security middlewares
// app.use(helmet());

// 2. Request parsing
// app.use(express.json());

// 3. Routes
// app.use(env.API_PREFIX, apiRoutes);

// 4. Not found middleware
app.use(notFoundMiddleware);

// 5. Centralized error handler
app.use(errorHandler);

export default app;
