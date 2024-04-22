require("dotenv").config();
import mongoose, { Document, Schema, Model } from "mongoose";

interface IDocument extends Document {
  user: object;
  public_id: string;
  url: string;
  pageCount: number;
  size: number;
  format: string;
}

// interface IMarCourse extends Document {
//   title: string;
//   platform: string;
//   marPoint: number;
//   isActive: boolean;
// }

interface IMarDb extends Document {
  user: object;
  title: string;
  marCategory: object;
  certificateDate: string;
  year: number;
  document: object;

  status: string;
}

interface ICategory extends Document {
  category: string;
  perMarPoints: number;
  maximumMarPoints: number;
  maxFile: number;
  isActive: boolean;
}

const documentsSchema = new Schema<IDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    pageCount: {
      type: Number,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// const marCourseSchema = new Schema<IMarCourse>(
//   {
//     title: {
//       type: String,
//       required: true,
//     },
//     platform: {
//       type: String,
//       required: true,
//     },
//     marPoint: {
//       type: Number,
//       required: true,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

const marDbSchema = new Schema<IMarDb>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type:String,
      required:true
    },
    marCategory: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "MarCategory",
    },
    year: {
      type: Number,
      required: true,
    },
    document: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "MarDocuments",
    },
    certificateDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

const categorySchema = new Schema<ICategory>(
  {
    category: {
      type: String,
      required: true,
    },
    perMarPoints: {
      type: Number,
      required: true,
    },
    maximumMarPoints: {
      type: Number,
      required: true,
    },
    maxFile:{
      type:Number,
      required:true
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

const documentsModel: Model<IDocument> = mongoose.model(
  "MarDocuments",
  documentsSchema
);

// const marCourseModel: Model<IMarCourse> = mongoose.model(
//   "MarCourse",
//   marCourseSchema
// );

const marModel: Model<IMarDb> = mongoose.model("Mar", marDbSchema);

const categoryModel: Model<ICategory> = mongoose.model("MarCategory", categorySchema);

export { marModel, documentsModel, categoryModel };
