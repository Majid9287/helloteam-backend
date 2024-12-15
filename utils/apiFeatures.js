class APIFeatures {
	constructor(query, queryString) {
		this.query = query;
		this.queryString = queryString;
	}

	filter() {
		// 1A) base filter
		const queryObj = { ...this.queryString };
		const excludedFields = ["page", "limit", "sort", "fields"];
		excludedFields.forEach((el) => delete queryObj[el]);

		// 1B) Advance filtering
		let queryStr = JSON.stringify(queryObj);
		queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

		this.query.find(JSON.parse(queryStr));

		return this;
	}

	sort() {
		if (this.queryString.sort) {
			// const sortBy = req.query.sort.replace(',', ' ');
			const sortBy = this.queryString.sort.split(",").join(" ");
			// sort('sort = price') [Ascending] &
			// sort('sort = -price')[Descending]
			this.query = this.query.sort(sortBy);
		} else {
			this.query = this.query.sort("-createdAt");
		}

		return this;
	}

	fieldsLimit() {
		if (this.queryString.fields) {
			const fields = this.queryString.fields.split(",").join(" ");
			// like: select('name price duration)
			this.query = this.query.select(fields);
		} else {
			this.query = this.query.select("-__v");
		}

		return this;
	}

	paginate() {
		const page = this.queryString.page * 1 || 1;
		const limit = this.queryString.limit * 1 || 100;
		const skip = (page - 1) * limit;

		this.query = this.query.skip(skip).limit(limit);

		return this;
	}
}

export default APIFeatures;
