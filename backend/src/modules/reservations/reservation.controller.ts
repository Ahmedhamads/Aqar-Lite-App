
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/http/send-success";

import {
  createCompanyReservation,
  getCompanyReservationById,
  getCompanyReservations,
} from "./reservation.service";

import type {
  CreateReservationInput,
  ReservationListQuery,
} from "./reservation.validation";

export async function createReservationController(
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

    const input = req.body as CreateReservationInput;

    
const reservation = await createCompanyReservation(
  req.tenant.companyId,
  req.tenant.userId,
  input,
  req.ip ?? null,
);

    sendSuccess(
      res,
      "Reservation created successfully.",
      reservation,
      201,
    );
  } catch (error: unknown) {
    next(error);
  }
}

export async function getReservationsController(
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

    const query = res.locals.validatedQuery as ReservationListQuery;

    const result = await getCompanyReservations(
      req.tenant.companyId,
      req.tenant.userId,
      req.tenant.role,
      query,
    );

    sendSuccess(
      res,
      "Reservations retrieved successfully.",
      result,
    );
  } catch (error: unknown) {
    next(error);
  }
}

export async function getReservationByIdController(
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

    const reservationId = req.params.id;

    if (typeof reservationId !== "string") {
      throw new ApiError(
        400,
        "INVALID_RESERVATION_ID",
        "Invalid reservation ID.",
      );
    }

    const reservation = await getCompanyReservationById(
      req.tenant.companyId,
      reservationId,
      req.tenant.userId,
      req.tenant.role,
    );

    if (!reservation) {
      throw new ApiError(
        404,
        "RESERVATION_NOT_FOUND",
        "Reservation not found.",
      );
    }

    sendSuccess(
      res,
      "Reservation retrieved successfully.",
      reservation,
    );
  } catch (error: unknown) {
    next(error);
  }
}
