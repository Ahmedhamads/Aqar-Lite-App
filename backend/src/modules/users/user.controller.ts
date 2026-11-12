
import type { Request, Response, NextFunction } from "express";

import {
  createCompanyUserService,
  getCompanyUsersService,
  getCompanyUserByIdService,
  updateCompanyUserService,
  setCompanyUserActiveStatusService,
} from "./user.service";

import type {
  CreateUserInput,
  UpdateUserInput,
  UserListQuery,
} from "./user.validation";

export async function createUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenant = req.tenant!;
    const input = req.body as CreateUserInput;

    const user = await createCompanyUserService(
      tenant.companyId,
      tenant.userId,
      input,
      req.ip,
    );

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUsersController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenant = req.tenant!;
    const query = res.locals.validatedQuery as UserListQuery;

    const result = await getCompanyUsersService(
      tenant.companyId,
      query,
    );

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function getUserByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenant = req.tenant!;
    const { id } = res.locals.validatedParams as {
  id: string;
};

    const user = await getCompanyUserByIdService(
      tenant.companyId,
      id,
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenant = req.tenant!;
    const { id } = res.locals.validatedParams as {
  id: string;
};
    const input = req.body as UpdateUserInput;

    const user = await updateCompanyUserService(
      tenant.companyId,
      tenant.userId,
      id,
      input,
      req.ip,
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenant = req.tenant!;
    const { id } = res.locals.validatedParams as {
  id: string;
};
    const { isActive } = req.body as { isActive: boolean };

    const user = await setCompanyUserActiveStatusService(
      tenant.companyId,
      tenant.userId,
      id,
      isActive,
      req.ip,
    );

    res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
