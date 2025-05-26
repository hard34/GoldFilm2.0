const { model, Schema } = require("mongoose");

const TemporaryCode = new Schema({
  code: { type: Number, required: true },
  email: { type: String, required: true },
});

module.exports = model("TemporaryCode", TemporaryCode);
