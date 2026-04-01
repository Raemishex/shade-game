import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  slug: string;
  nameAz: string;
  nameEn: string;
  icon: string;
  isPremium: boolean;
  fs5Only: boolean;
  wordCount: number;
}

const CategorySchema = new Schema<ICategory>({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  nameAz: {
    type: String,
    required: true,
    trim: true,
  },
  nameEn: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String,
    required: true,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  fs5Only: {
    type: Boolean,
    default: false,
  },
  wordCount: {
    type: Number,
    default: 0,
  },
});

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
