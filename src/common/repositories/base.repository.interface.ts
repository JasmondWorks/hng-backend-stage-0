export interface QueryParams {
  sort?: string;
  page?: number;
  limit?: number;
  fields?: string;
}

export interface IRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findAll(queryParams: QueryParams): Promise<T[]>;
  findOne(filter: Partial<T>): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T | null>;
  delete(id: string): Promise<void>;
}
