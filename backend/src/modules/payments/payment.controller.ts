
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/http/send-success";

import { createCompanyPayment,getCompanyPayments } from "./payment.service";
import {
  createPaymentSchema,
  idempotencyKeySchema,
  paymentListQuerySchema,
} from "./payment.validation";
export async function createPaymentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.tenant) {
      throw new ApiError(
        401,
        "UNAUTHENTICATED",
        "Authentication is required.",
      );
    }

    const body = createPaymentSchema.parse(req.body);

    const contractId = req.params.contractId;

    if (typeof contractId !== "string") {
      throw new ApiError(
        400,
        "INVALID_CONTRACT_ID",
        "Invalid contract ID.",
      );
    }

    const idempotencyKey = idempotencyKeySchema.safeParse(
      req.get("Idempotency-Key"),
    );

    if (!idempotencyKey.success) {
      throw new ApiError(
        400,
        "INVALID_IDEMPOTENCY_KEY",
        "A valid Idempotency-Key header is required.",
      );
    }

    const payment = await createCompanyPayment({
      companyId: req.tenant.companyId,
      accountantId: req.tenant.userId,
      contractId,
      amount: body.amount,
      idempotencyKey: idempotencyKey.data,
      ipAddress: req.ip ?? null,
    });

    sendSuccess(
      res,
      "Payment recorded successfully.",
      payment,
      201,
    );
  } catch (error: unknown) {
    next(error);
  }
}
// ----------------------------------------
// GET COMPANY PAYMENTS
// ----------------------------------------

export async function getPaymentsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.tenant) {
      throw new ApiError(
        401,
        "UNAUTHENTICATED",
        "Authentication is required.",
      );
    }

    const query = paymentListQuerySchema.parse(req.query);

    const result = await getCompanyPayments({
      companyId: req.tenant.companyId,
      query,
    });

    sendSuccess(
      res,
      "Payments retrieved successfully.",
      result,
    );
  } catch (error: unknown) {
    next(error);
  }
}