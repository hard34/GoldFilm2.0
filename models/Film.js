const { model, Schema } = require("mongoose");

const Film = new Schema({
  kinopoiskId: { type: String, required: true, unique: true },
  nameRu: { type: String, required: true },
  posterUrlPreview: { type: String },
  posterUrl: { type: String },
  year: { type: Number },
  genres: [{ 
    genre: { type: String }
  }],
  ratingKinopoisk: { type: Number },
  description: { type: String },
  type: { type: String },
  ratingAgeLimits: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model("Film", Film); 