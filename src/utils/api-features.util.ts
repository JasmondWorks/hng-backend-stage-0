import { profileFiltersMap } from "../common/constants/profileFilterMap";

export class APIFeatures {
  private query: any;
  private queryObj: any;

  constructor(query: any, queryObj: any) {
    this.query = query; // e.g. Model.find()
    this.queryObj = queryObj; // req.query (formatted key-value pairs)
  }

  filter() {
    const queryObj = { ...this.queryObj };
    const excludedFields = ["page", "sort_by", "limit", "fields", "q"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Convert operators to Mongo format
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|ne|in)\b/g,
      (match) => `$${match}`,
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryObj.sort_by) {
      const sortBy = this.queryObj.sort_by.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryObj.page) || 1;
    const limit = Math.min(parseInt(this.queryObj.limit) || 10, 100);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  limitFields() {
    if (this.queryObj.fields) {
      const fields = this.queryObj.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

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

  getQuery() {
    return this.query;
  }
}
