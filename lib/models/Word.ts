import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWord extends Document {
  categoryId: Types.ObjectId;
  wordAz: string;
  wordEn: string;
  image: string | null;
  difficulty: 1 | 2 | 3;
  isActive: boolean;
}

const WordSchema = new Schema<IWord>({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
    index: true,
  },
  wordAz: {
    type: String,
    required: true,
    trim: true,
  },
  wordEn: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: null,
  },
  difficulty: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    default: 2,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Compound index: kateqoriya + aktiv sözləri sürətlə tapmaq üçün
WordSchema.index({ categoryId: 1, isActive: 1 });

const Word: Model<IWord> =
  mongoose.models.Word || mongoose.model<IWord>("Word", WordSchema);

export default Word;
