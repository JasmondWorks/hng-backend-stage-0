import { profileFiltersMap } from "../common/constants/profileFilterMap";

export class APIFeatures {
  private query: any;
  private queryObj: any;

  private buildFilter = (obj: any): any => {
    const operatorMap: any = {
      gte: "$gte",
      gt: "$gt",
      lte: "$lte",
      lt: "$lt",
      ne: "$ne",
    };
    const result: any = {};

    for (const key in obj) {
      if (typeof obj[key] === "object") {
        result[key] = {};

        for (const op in obj[key]) {
          const mongoOp = operatorMap[op];
          result[key][mongoOp] = Number(obj[key][op]);
        }
      } else {
        result[key] = obj[key];
      }
    }

    return result;
  };

  private castValues = (obj: any): any => {
    for (const key in obj) {
      if (typeof obj[key] === "object") {
        this.castValues(obj[key]);
      } else {
        if (!isNaN(obj[key])) {
          obj[key] = Number(obj[key]);
        }
      }
    }
    return obj;
  };

  constructor(query: any, queryObj: any) {
    this.query = query; // e.g. Model.find()
    this.queryObj = queryObj; // req.query
  }

  normalizeQuery(query: string = "") {
    let filters: {
      min_age: number | undefined;
      max_age: number | undefined;
      age_group:
        | "adult"
        | "teenager"
        | "child"
        | "baby"
        | "toddler"
        | "senior"
        | "middle-aged"
        | "young-adult"
        | undefined;
      gender: string | undefined;
      startsWith: string;
      endsWith: string;
      country_name: string | undefined;
      country_id: string | undefined;
      country_probability: number | undefined;
    } = {
      min_age: 1,
      max_age: undefined,
      age_group: undefined,
      gender: undefined,
      startsWith: "",
      endsWith: "",
      country_name: undefined,
      country_id: undefined,
      country_probability: undefined,
    };

    const updateFilters = (currentFilters: any, filter: any) => {
      return { ...currentFilters, ...filter.value };
    };

    const q = query.toLowerCase();

    for (const filter of profileFiltersMap) {
      if (q.includes(filter.key)) {
        filters = updateFilters(filters, filter);
      }
    }

    // // Name starts with
    // const startsMatch = q.match(/start[s]? with ['"]?([a-z])/);
    // if (startsMatch) {
    //   filters.startsWith = startsMatch[1];
    // }

    // // Name ends with
    // const endsMatch = q.match(/end[s]? with ['"]?([a-z])/);
    // if (endsMatch) {
    //   filters.endsWith = endsMatch[1];
    // }

    return filters;
  }

  // 🔎 FILTERING
  filter() {
    const queryObj = { ...this.queryObj };

    const excludedFields = ["page", "sort_by", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Convert operators to Mongo format
    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|ne|in)\b/g,
      (match) => `$${match}`,
    );

    const parsedQuery = this.buildFilter(JSON.parse(queryStr));

    this.query = this.query.find(parsedQuery);

    return this;
  }

  // 🔃 SORTING
  sort() {
    if (this.queryObj.sort_by) {
      const sortBy = this.queryObj.sort_by.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  // 📄 PAGINATION
  paginate() {
    const page = parseInt(this.queryObj.page) || 1;
    const limit = Math.min(parseInt(this.queryObj.limit) || 10, 100);

    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  // 🎯 FIELD LIMITING
  limitFields() {
    if (this.queryObj.fields) {
      const fields = this.queryObj.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  // 🔍 TEXT SEARCH (basic)
  search() {
    if (this.queryObj.q) {
      this.query = this.query.find({
        $or: [
          { name: { $regex: this.queryObj.q, $options: "i" } },
          { email: { $regex: this.queryObj.q, $options: "i" } },
        ],
      });
    }

    return this;
  }
}
