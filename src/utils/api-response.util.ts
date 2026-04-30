import { Response } from "express";

interface PaginationLinks {
  self: string;
  next: string | null;
  prev: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages?: number;
  links?: PaginationLinks;
}

interface ResponseOptions {
  message?: string;
  statusCode?: number;
  pagination?: Pagination;
}

export const sendSuccess = (
  res: Response,
  data: any,
  options: ResponseOptions = {},
) => {
  const { message, statusCode = 200, pagination } = options;
  return res.status(statusCode).json({
    status: "success",
    ...(message && { message }),
    ...(pagination && {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      ...(pagination.total_pages !== undefined && {
        total_pages: pagination.total_pages,
      }),
      ...(pagination.links && { links: pagination.links }),
    }),
    data,
  });
};

// Builds the self/next/prev links for a paginated response.
// Pass req.originalUrl so the base path and existing filter params are preserved.
export function buildPaginationLinks(
  originalUrl: string,
  page: number,
  limit: number,
  total: number,
): { total_pages: number; links: PaginationLinks } {
  const total_pages = Math.ceil(total / limit);
  const basePath = originalUrl.split("?")[0]!;

  const existing = new URLSearchParams(originalUrl.split("?")[1] ?? "");

  const buildUrl = (p: number) => {
    const params = new URLSearchParams(existing);
    params.set("page", String(p));
    params.set("limit", String(limit));
    return `${basePath}?${params.toString()}`;
  };

  return {
    total_pages,
    links: {
      self: buildUrl(page),
      next: page < total_pages ? buildUrl(page + 1) : null,
      prev: page > 1 ? buildUrl(page - 1) : null,
    },
  };
}
