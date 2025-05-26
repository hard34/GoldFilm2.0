const AuthService = require("../services/auth.service");

const notVerified = { verified: false };

module.exports = async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const verified = AuthService.verifyAccessToken(
      req.headers.authorization.split(" ")[1]
    );
    if (!verified) {
      return res.json(notVerified);
    }
    req.user = verified;
    next();
  } catch (e) {
    console.log(e);
    res.json(notVerified);
  }
};
