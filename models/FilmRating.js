const { model, Schema } = require("mongoose");

const FilmRating = new Schema({
  filmId: { type: String, required: true },
  userId: { type: String, required: true },
  like: { type: Boolean, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model("FilmRating", FilmRating); 