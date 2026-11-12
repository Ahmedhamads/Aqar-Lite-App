
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/http/send-success";

import {
  createCompanyClient,
  deleteCompanyClient,
  getCompanyClientById,
  getCompanyClients,
  updateCompanyClient,
} from "./client.service";

import type {
  CreateClientInput,
  UpdateClientInput,
  ClientListQuery,
} from "./client.validation";

export async function createClientController(
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

    
    const client = await createCompanyClient(
  req.tenant.companyId,
  req.tenant.userId,
  req.body as CreateClientInput,
  req.ip ?? null,
);

    sendSuccess(
      res,
      "Client created successfully.",
      client,
      201,
    );
  } catch (error: unknown) {
    next(error);
  }
}

export async function getClientsController(
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

    const query =
      res.locals.validatedQuery as ClientListQuery;

    const result = await getCompanyClients(
      req.tenant.companyId,
      req.tenant.userId,
      query,
    );

    sendSuccess(
      res,
      "Clients retrieved successfully.",
      result,
    );
  } catch (error: unknown) {
    next(error);
  }
}

export async function getClientByIdController(
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

    const clientId = req.params.id;

    if (typeof clientId !== "string") {
      throw new ApiError(
        400,
        "INVALID_CLIENT_ID",
        "Invalid client ID.",
      );
    }

    const client = await getCompanyClientById(
      req.tenant.companyId,
      req.tenant.userId,
      clientId,
    );

    sendSuccess(
      res,
      "Client retrieved successfully.",
      client,
    );
  } catch (error: unknown) {
    next(error);
  }
}

export async function updateClientController(
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

    const clientId = req.params.id;

    if (typeof clientId !== "string") {
      throw new ApiError(
        400,
        "INVALID_CLIENT_ID",
        "Invalid client ID.",
      );
    }

    const client = await updateCompanyClient(
    req.tenant.companyId,
    req.tenant.userId,
    clientId,
    req.body as UpdateClientInput,
    req.ip ?? null,
    );
    sendSuccess(
      res,
      "Client updated successfully.",
      client,
    );
  } catch (error: unknown) {
    next(error);
  }
}


export async function deleteClientController(
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

    const clientId = req.params.id;

    if (typeof clientId !== "string") {
      throw new ApiError(
        400,
        "INVALID_CLIENT_ID",
        "Invalid client ID.",
      );
    }

    const result = await deleteCompanyClient(
      req.tenant.companyId,
      req.tenant.userId,
      clientId,
      req.ip ?? null,
    );

    sendSuccess(
      res,
      "Client deleted successfully.",
      result,
    );
  } catch (error: unknown) {
    next(error);
  }
}
