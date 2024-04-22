require("dotenv").config();
import mongoose, { Document, Schema } from "mongoose";
import { Model } from "mongoose";

interface IDocument extends Document {
  user: object;
  public_id: string;
  url: string;
  pageCount: number;
  size: number;
  format: string;
}

interface IMoocsCourse extends Document {
  title: string;
  platform: string;
  credit: number;
  isActive: boolean;
}

interface IMoocsDb extends Document {
  user: object;
  moocsCourse: object;
  startDate: string;
  endDate: string;
  year: number;
  document: object;
  verificationUrl:string;
  status: string;
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

const moocsCourseSchema = new Schema<IMoocsCourse>(
  {
    title: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      required: true,
    },
    credit: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

const moocsDbSchema = new Schema<IMoocsDb>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    moocsCourse: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "MoocsCourse",
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    document: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "MoocsDocuments",
    },
    verificationUrl: {
        type:String,
        required:true
    },
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

const documentsModel: Model<IDocument> = mongoose.model(
  "MoocsDocuments",
  documentsSchema
);

const moocsCourseModel: Model<IMoocsCourse> = mongoose.model(
  "MoocsCourse",
  moocsCourseSchema
);
const moocsModel: Model<IMoocsDb> = mongoose.model("Moocs", moocsDbSchema);

export { moocsModel, documentsModel, moocsCourseModel };
