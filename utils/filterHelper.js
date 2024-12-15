export const buildFilterQuery = (query) => {
    const {
        category, latest, newArrival, status, userId, attribute, brand,color, isFeatured
    } = query;
    let filter = {};

    if (category) filter.category = category;

    if (status) filter.status = status;

    if (brand) filter.brand = brand;

    if (userId) filter.userId = userId;

    if (attribute) filter.attributes = { $in: attribute.split(',') };

    if (color) filter.colors = { $in: color.split(',') };

    if (isFeatured === 'true') filter.isFeatured = true;

    if (latest === 'true') {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        filter.createdAt = { $gte: last7Days };
    }

    if (newArrival === 'true') {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        filter.createdAt = { $gte: last30Days };
    }

    return filter;
};

export const buildSortOptions = (sort, order) => {
    let sortOptions = {};
    if (sort) {
        sortOptions[sort] = order === 'asc' ? 1 : -1;
    } else {
        sortOptions.createdAt = -1;
    }
    return sortOptions;
};
