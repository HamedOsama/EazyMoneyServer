class ApiFeatures {
  constructor(query) {
    this.query = query;
  }
  static async pagination(query, pageNum, resultPerPage = 10) {
    const currentPage = +pageNum || 1;
    const skip = +resultPerPage * (currentPage - 1);
    const newQuery = await query.limit(+resultPerPage).skip(skip)
    return newQuery;
  }
}
module.exports = ApiFeatures;