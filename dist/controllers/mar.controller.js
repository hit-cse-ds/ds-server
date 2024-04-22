"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerifiedMarCategories = exports.getMyMar = exports.deleteMAR = exports.uploadMAR = void 0;
const ErrorHandler_1 = __importDefault(require("../utlis/ErrorHandler"));
const CatchAsyncError_1 = require("../middleware/CatchAsyncError");
const cloudinary_1 = __importDefault(require("cloudinary"));
const mar_model_1 = require("../models/mar.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const redis_1 = require("../utlis/redis");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage }).single("file");
// Uplaod Mar points
exports.uploadMAR = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (err) {
                return next(new ErrorHandler_1.default("File upload failed", 400));
            }
            try {
                const { title, year, category, date } = req.body;
                // Check if the user exists
                const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
                if (!user) {
                    return next(new ErrorHandler_1.default("User not found", 400));
                }
                // Check if the user has already uploaded MAR with the same title
                const existingMAR = yield mar_model_1.marModel.findOne({
                    user: user._id,
                    title: title,
                });
                if (existingMAR) {
                    return next(new ErrorHandler_1.default("You have already uploaded MAR with this title", 400));
                }
                const file = req.file; // Access the uploaded file
                if (!file) {
                    return next(new ErrorHandler_1.default("No file uploaded", 400));
                }
                // Create a temporary file path
                const tempFilePath = `temp_${Date.now()}_${file.originalname}`;
                // Write the buffer to the temporary file
                fs_1.default.writeFileSync(tempFilePath, file.buffer);
                // Upload temporary file to Cloudinary
                const myCloud = yield cloudinary_1.default.v2.uploader.upload(tempFilePath, {
                    folder: "Document_MAR",
                });
                // Delete the temporary file
                fs_1.default.unlinkSync(tempFilePath);
                const documentData = {
                    user: user._id,
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                    pageCount: myCloud.pages,
                    size: myCloud.bytes,
                    format: myCloud.format,
                };
                // Retrieve category data
                const categoryData = yield mar_model_1.categoryModel.findById(category);
                if (!categoryData) {
                    return next(new ErrorHandler_1.default("Category not found", 404));
                }
                // Check if the student has already crossed the maxFile limit in the selected category
                const existingMARsInCategory = yield mar_model_1.marModel.countDocuments({
                    user: user._id,
                    marCategory: category,
                });
                if (existingMARsInCategory >= categoryData.maxFile) {
                    return next(new ErrorHandler_1.default(`You have already uploaded the maximum number of files in this category`, 400));
                }
                const points = categoryData.perMarPoints;
                const marDocument = yield mar_model_1.documentsModel.create(documentData);
                // Calculate current MAR points within the category
                const currentCategoryPoints = yield mar_model_1.marModel.aggregate([
                    {
                        $match: {
                            marCategory: category,
                            user: user._id,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalPoints: { $sum: "$points" },
                        },
                    },
                ]);
                // Get maximum MAR points allowed for the category from the database
                const maxCategoryPoints = categoryData.maximumMarPoints;
                // Calculate overall MAR points collected across all categories
                const overallPoints = yield mar_model_1.marModel.aggregate([
                    {
                        $match: {
                            user: user._id,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalPoints: { $sum: "$points" },
                        },
                    },
                ]);
                // Check if adding new points exceeds the maximum allowed
                if (((_b = currentCategoryPoints[0]) === null || _b === void 0 ? void 0 : _b.totalPoints) + points >
                    (maxCategoryPoints !== null && maxCategoryPoints !== void 0 ? maxCategoryPoints : Number.MAX_VALUE)) {
                    return next(new ErrorHandler_1.default(`Adding ${points} MAR points exceeds the maximum allowed for category ${category}`, 400));
                }
                const data = {
                    user: user._id,
                    title: title,
                    year: year,
                    marCategory: category,
                    certificateDate: date,
                    document: marDocument._id,
                    points: points, // Add points to the data
                };
                const mar = yield mar_model_1.marModel.create(data);
                // Push the newly created MAR document ID to the user's mar array
                user.mar.push(mar._id);
                yield user.save();
                yield redis_1.redis.set((_c = req.user) === null || _c === void 0 ? void 0 : _c._id, JSON.stringify(user));
                res.status(201).json({
                    success: true,
                    mar,
                    overallPoints: (_e = (_d = overallPoints[0]) === null || _d === void 0 ? void 0 : _d.totalPoints) !== null && _e !== void 0 ? _e : 0, // Return overall MAR points collected
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }));
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.deleteMAR = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h;
    try {
        const marId = req.params.id;
        // Find the MAR entry by its ID
        const mar = yield mar_model_1.marModel.findById(marId);
        if (!mar) {
            return next(new ErrorHandler_1.default("MAR entry not found", 404));
        }
        // Check if the logged-in user is the owner of the MAR entry
        if (mar.user.toString() !== ((_f = req.user) === null || _f === void 0 ? void 0 : _f._id.toString())) {
            return next(new ErrorHandler_1.default("You are not authorized to delete this MAR entry", 403));
        }
        // Check if the Moocs entry status is "verified"
        if (mar.status === "verified") {
            return next(new ErrorHandler_1.default("Cannot delete a verified Mar entry", 403));
        }
        // Delete the document from Cloudinary
        const document = yield mar_model_1.documentsModel.findById(mar.document);
        if (document) {
            yield cloudinary_1.default.v2.uploader.destroy(document.public_id);
            yield document.deleteOne();
        }
        // Delete the MAR entry from the database
        yield mar.deleteOne();
        const user = yield user_model_1.default.findById((_g = req.user) === null || _g === void 0 ? void 0 : _g._id);
        if (user) {
            const index = user.mar.indexOf(marId);
            if (index !== -1) {
                user.mar.splice(index, 1);
                yield user.save();
                yield redis_1.redis.set((_h = req.user) === null || _h === void 0 ? void 0 : _h._id, JSON.stringify(user));
            }
        }
        res.status(200).json({
            success: true,
            message: "MAR entry and associated document deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get all mar point list
exports.getMyMar = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k;
    try {
        const user = yield user_model_1.default.findById((_j = req.user) === null || _j === void 0 ? void 0 : _j._id).populate({
            path: "mar",
            populate: [
                {
                    path: "marCategory",
                    model: "MarCategory",
                },
                {
                    path: "document",
                    model: "MarDocuments",
                },
            ],
        });
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 400));
        }
        const mar = user.mar;
        // Calculate total credit points of verified Moocs entries
        let totalMarPoints = 0;
        mar.forEach((mar) => {
            if (mar.status === "verified") {
                // Ensure mooc is properly typed as MoocsDocument
                totalMarPoints += mar.marCategory.perMarPoints;
            }
        });
        if (user.totalMar !== totalMarPoints) {
            user.totalMar = totalMarPoints;
            yield user.save();
            yield redis_1.redis.set((_k = req.user) === null || _k === void 0 ? void 0 : _k._id, JSON.stringify(user));
        }
        res.status(200).json({
            success: true,
            totalMarPoints,
            mar,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//  get category list :-
exports.getVerifiedMarCategories = (0, CatchAsyncError_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch verified MAR categories from the database
        const categories = yield mar_model_1.categoryModel.find({ isActive: true });
        res.status(200).json({
            success: true,
            categories
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//# sourceMappingURL=mar.controller.js.map