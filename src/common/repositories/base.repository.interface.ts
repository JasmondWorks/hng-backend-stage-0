export interface QueryParams {
  sort_by?: string;
  order?: string;
  page?: string;
  limit?: string;
  fields?: string;
  [key: string]: any;
}

export interface IRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findAll(queryParams: QueryParams): Promise<T[]>;
  findOne(filter: Partial<T>): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T | null>;
  delete(id: string): Promise<void>;
}
