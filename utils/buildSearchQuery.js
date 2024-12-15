export const buildSearchQuery = (searchParams) => {
	const query = {};

	if (searchParams.orderStatus) {
		query.orderStatus = searchParams.orderStatus;
	}

	if (searchParams.customerId) {
		query.customer = searchParams.customerId;
	}

	// Vendor ID filter
	if (searchParams.vendorId) {
		query.vendor = searchParams.vendorId;
	}

	// Product IDs filter
	if (searchParams.productIds && Array.isArray(searchParams.productIds)) {
		query.products = { $in: searchParams.productIds };
	}

	// Date range filter
	if (searchParams.startDate && searchParams.endDate) {
		query.createdAt = {
			$gte: new Date(searchParams.startDate),
			$lte: new Date(searchParams.endDate),
		};
	}

	// Price range filter
	if (searchParams.minPrice && searchParams.maxPrice) {
		query.totalPrice = {
			$gte: Number(searchParams.minPrice),
			$lte: Number(searchParams.maxPrice),
		};
	}

	// Search term filter across various fields
	if (searchParams.searchTerm) {
		query.$or = [
			{ "products.name": new RegExp(searchParams.searchTerm, "i") },
			{ "customer.firstName": new RegExp(searchParams.searchTerm, "i") },
			{ "customer.lastName": new RegExp(searchParams.searchTerm, "i") },
			{ "vendor.shopName": new RegExp(searchParams.searchTerm, "i") },
		];
	}

	// Category ID filter
	if (searchParams.categoryId) {
		query["products.category._id"] = searchParams.categoryId;
	}

	// Brand ID filter
	if (searchParams.brandId) {
		query["products.brand._id"] = searchParams.brandId;
	}

	// Category slug filter
	if (searchParams.categorySlug) {
		query["products.categorySlug"] = searchParams.categorySlug;
	}

	// Brand slug filter
	if (searchParams.brandSlug) {
		query["products.brandSlug"] = searchParams.brandSlug;
	}

	console.log("Search Query:", query); // For debugging purposes

	return query;
};
