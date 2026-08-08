import { Op, type WhereOptions } from 'sequelize';

import type { CreateUserInput, User } from '@/types/user';
import type { AuthUserRegisteredPayload } from '@chatapp/common';

import { UserModel } from '@/db';

const toDomainUser = (model: UserModel): User => ({
  id: model.id,
  email: model.email,
  displayName: model.displayName,
  image_url: model.image_url,
  role: model.role,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findByPk(id);
    return user ? toDomainUser(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await UserModel.findAll({
      order: [['displayName', 'ASC']],
    });
    return users.map(toDomainUser);
  }

  async create(data: CreateUserInput): Promise<User> {
    const user = await UserModel.create(data);
    return toDomainUser(user);
  }

  async searchByQuery(
    query: string,
    options: { limit?: number; excludeIds?: string[] } = {},
  ): Promise<User[]> {
    const where: WhereOptions = {
      [Op.or]: [
        { displayName: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } },
      ],
    };

    if (options.excludeIds && options.excludeIds.length > 0) {
      Object.assign(where, {
        [Op.and]: [{ id: { [Op.notIn]: options.excludeIds } }],
      });
    }

    const users = await UserModel.findAll({
      where,
      order: [['displayName', 'ASC']],
      limit: options.limit ?? 10,
    });

    return users.map(toDomainUser);
  }

  async upsertFromAuthEvent(payload: AuthUserRegisteredPayload): Promise<User> {
    const [user] = await UserModel.upsert(
      {
        id: payload.id,
        email: payload.email,
        displayName: payload.displayName,
        image_url: payload.image_url,
        role: payload.role,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
        updatedAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
      },
      { returning: true },
    );

    return toDomainUser(user);
  }

  async editUser(id: string, payload: CreateUserInput) {
    const user = await UserModel.update(
      {
        email: payload.email,
        role: payload.role,
        displayName: payload.displayName,
        image_url:payload.image_url,
      },
      { where: { id }, returning: true },
    );
    return toDomainUser(user[1][0]);
  }

  async deleteUser(id: string) {
    return UserModel.destroy({ where: { id } });
  }
}

export const userRepository = new UserRepository();
