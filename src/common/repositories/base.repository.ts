import { AppError } from "../../utils/app-error.util";
import { IRepository, QueryParams } from "./base.repository.interface";
import { buildPrismaQuery } from "../../utils/prisma-query-builder.util";

export abstract class BaseRepository<T, CreateInput, UpdateInput>
  implements IRepository<T, CreateInput, UpdateInput>
{
  protected abstract readonly delegate: any;

  async findById(id: string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    return this.delegate.findFirst({ where: filter });
  }

  async create(data: CreateInput): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: UpdateInput): Promise<T | null> {
    try {
      return await this.delegate.update({ where: { id }, data });
    } catch (err: any) {
      if (err?.code === "P2025") return null;
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.delegate.delete({ where: { id } });
    } catch (err: any) {
      if (err?.code === "P2025") throw new AppError("Record not found", 404);
      throw err;
    }
  }

  async findAll(queryParams: QueryParams): Promise<T[]> {
    const { where, orderBy, skip, take } = buildPrismaQuery(queryParams);
    return this.delegate.findMany({ where, orderBy, skip, take });
  }

  // Returns every matching record without pagination — used for data exports.
  async findAllRaw(queryParams: QueryParams): Promise<T[]> {
    const { where, orderBy } = buildPrismaQuery(queryParams);
    return this.delegate.findMany({ where, orderBy });
  }

  async findAllWithPagination(queryParams: QueryParams) {
    const { where, orderBy, skip, take, page, limit } = buildPrismaQuery(queryParams);

    const [total, data] = await Promise.all([
      this.delegate.count({ where }),
      this.delegate.findMany({ where, orderBy, skip, take }),
    ]);

    return { data: data as T[], pagination: { page, limit, total } };
  }
}
