import { userService } from '@/services/user.service';
import { CreateUserBody, SearchUsersQuery, UserIdParams } from '@/validation/user.schema';
import type { AsyncHandler } from '@chatapp/common';

export const getUser: AsyncHandler = async (req, res, next) => {
  try {
    const { id } = req.params as unknown as UserIdParams;
    const user = await userService.getUserById(id);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers: AsyncHandler = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser: AsyncHandler = async (req, res, next) => {
  try {
    const payload = req.body as CreateUserBody;
    const user = await userService.createUser(payload);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const editUser: AsyncHandler = async (req, res, next) => {
  try {
    const { id } = req.params as unknown as UserIdParams;
    const payload = req.body as CreateUserBody;
    const user = await userService.editUser(id, payload);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const searchUsers: AsyncHandler = async (req, res, next) => {
  try {
    const { query, limit, exclude } = req.query as unknown as SearchUsersQuery;
    const user = await userService.searchUsers({
      query,
      limit,
      excludeIds: exclude,
    });
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser: AsyncHandler = async (req, res, next) => {
  try {
    const { id } = req.params as unknown as UserIdParams;
    console.log('[userService controller] Deleting user:', id);
    await userService.deleteUser(id);
    res.status(200).json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
};
