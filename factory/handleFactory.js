
import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import mongoose from 'mongoose';

// DELETE One Document
export const deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id).exec();

        const docName = Model.modelName.toLowerCase() || 'document';

        if (!doc) {
            return next(new AppError(`No ${docName} found with that ID`, 404));
        }

        res.status(204).json({
            status: 'success',
            doc: null,
        });
    });

// UPDATE One Document
export const updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        const docName = Model?.modelName?.toLowerCase() || 'document';

        if (!doc) {
            return next(new AppError(`No ${docName} found with that ID`, 404));
        }

        res.status(200).json({
            status: 'success',
            doc,
        });
    });

// CREATE One Document
export const createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        let filteredData = req.body;


        const doc = await Model.create(filteredData);

        if (!doc) {
            return next(new AppError(`${Model.modelName} could not be created`, 400));
        }

        res.status(201).json({
            status: 'success',
            doc,
        });
    });

// GET One Document
export const getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);

        if (popOptions && popOptions.path) query = query.populate(popOptions);
        const doc = await query;

        const docName = Model.modelName.toLowerCase() || 'document';

        if (!doc) {
            return next(new AppError(`No ${docName} found with that ID`, 404));
        }

        res.status(200).json({
            status: 'success',
            doc,
        });
    });

// GET All Documents
export const getAll = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.find();

        if (popOptions?.path) {
            if (Array.isArray(popOptions.path)) {
                popOptions.path.forEach((pathOption) => {
                    query = query.populate(pathOption);
                });
            } else {
                query = query.populate(popOptions);
            }
        }

        const features = new APIFeatures(query, req.query)
            .filter()
            .sort()
            .fieldsLimit()
            .paginate();

        const doc = await features.query;

        res.status(200).json({
            status: 'success',
            results: doc.length,
            doc,
        });
    });
