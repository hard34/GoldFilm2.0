const express = require("express");
const cors = require("cors");
const config = require("config");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(cookieParser());
app.use(
  cors({
    origin: config.get("CLIENT_URL"),
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })
);

app.use(express.json({ extended: true }));
app.use("/api", require("./routers/auth.router"));

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(config.get("PORT"), () => {
  try {
    mongoose.connect(config.get("DATABASE_CONNECTION_URL"), {
      useNewUrlParser: true,
    });
    console.log("SERVER WORKS...");
  } catch (e) {
    console.log(e);
  }
});
