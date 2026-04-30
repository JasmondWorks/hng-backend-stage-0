export class APIFeatures {
  private query: any;
  private queryObj: any;

  constructor(query: any, queryObj: any) {
    this.query = query;
    this.queryObj = queryObj;
  }

  filter() {
    const queryObj = { ...this.queryObj };
    const excludedFields = ["page", "sort_by", "order", "limit", "fields", "q"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Lift explicit range params into proper Mongo $gte/$lte operators
    const rangeQuery: Record<string, any> = {};

    if (queryObj.min_age !== undefined) {
      rangeQuery.age = rangeQuery.age ?? {};
      rangeQuery.age.$gte = parseInt(queryObj.min_age as string);
      delete queryObj.min_age;
    }
    if (queryObj.max_age !== undefined) {
      rangeQuery.age = rangeQuery.age ?? {};
      rangeQuery.age.$lte = parseInt(queryObj.max_age as string);
      delete queryObj.max_age;
    }
    if (queryObj.min_gender_probability !== undefined) {
      rangeQuery.gender_probability = rangeQuery.gender_probability ?? {};
      rangeQuery.gender_probability.$gte = parseFloat(queryObj.min_gender_probability as string);
      delete queryObj.min_gender_probability;
    }
    if (queryObj.min_country_probability !== undefined) {
      rangeQuery.country_probability = rangeQuery.country_probability ?? {};
      rangeQuery.country_probability.$gte = parseFloat(queryObj.min_country_probability as string);
      delete queryObj.min_country_probability;
    }
    if (queryObj.max_country_probability !== undefined) {
      rangeQuery.country_probability = rangeQuery.country_probability ?? {};
      rangeQuery.country_probability.$lte = parseFloat(queryObj.max_country_probability as string);
      delete queryObj.max_country_probability;
    }

    // Convert shorthand operators (gte, lte, etc.) produced by the search path
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|ne|in)\b/g,
      (match) => `$${match}`,
    );

    this.query = this.query.find({ ...JSON.parse(queryStr), ...rangeQuery });
    return this;
  }

  sort() {
    if (this.queryObj.sort_by) {
      const direction = this.queryObj.order === "desc" ? "-" : "";
      const sortBy = this.queryObj.sort_by
        .split(",")
        .map((field: string) => `${direction}${field.trim()}`)
        .join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-created_at");
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryObj.page) || 1;
    const limit = Math.min(parseInt(this.queryObj.limit) || 10, 50);
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  limitFields() {
    if (this.queryObj.fields) {
      const fields = this.queryObj.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v -_id");
    }
    return this;
  }

  getQuery() {
    return this.query;
  }
}
