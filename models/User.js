const { model, Schema } = require("mongoose");

const User = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  refreshToken: { type: String },
  isAdmin: { type: Boolean, default: false },
  visitedFilms: [{ type: String }], // последние посещённые фильмы
  isActivated: { type: Boolean, default: false },
  likedFilms: [{ type: String }] // понравившиеся фильмы
});

module.exports = model("User", User);
