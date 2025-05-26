const AuthController = require("../controllers/auth.controller");
const { check } = require("express-validator");
const authMiddleware = require("../middleware/auth.middleware");
const User = require('../models/User');
const FilmRating = require('../models/FilmRating');
const Film = require('../models/Film');

const router = require("express").Router();

router.post(
  "/registration",
  [
    check("email", AuthController.errorTypes.incorrectEmail).isEmail(),
    check("password", AuthController.errorTypes.weakPassword).optional().isLength({
      min: 6,
    }),
  ],
  (req, res) => {
    try {
      AuthController.registration(req, res);
    } catch (e) {
      console.log(e);
      res.json({ error: AuthController.errorTypes.error });
    }
  }
);

router.post(
  "/login",
  [
    check("email", AuthController.errorTypes.incorrectEmail).isEmail(),
    check("password", AuthController.errorTypes.passwordNotEntered).optional().exists(),
  ],
  (req, res) => {
    try {
      AuthController.login(req, res);
    } catch (e) {
      console.log(e);
      res.json({ error: AuthController.errorTypes.error });
    }
  }
);

router.get("/refresh", (req, res) => {
  try {
    AuthController.refresh(req, res);
  } catch (e) {
    console.log(e);
    res.json({ error: AuthController.errorTypes.error });
  }
});

router.get("/exists/:value", (req, res) => {
  try {
    AuthController.exists(req, res);
  } catch (e) {
    console.log(e);
    res.json({ error: AuthController.errorTypes.error });
  }
});

router.get("/send/:email", (req, res) => {
  try {
    AuthController.send(req, res);
  } catch (e) {
    console.log(e);
    res.json({ error: AuthController.errorTypes.error });
  }
});

router.get("/confirm/:code/:id", (req, res) => {
  try {
    AuthController.checkConfirmation(req, res);
  } catch (e) {
    console.log(e);
    res.json({ error: AuthController.errorTypes.error });
  }
});

router.post(
  "/check-password",
  [check("password", AuthController.errorTypes.passwordNotEntered).optional().exists()],
  (req, res) => {
    try {
      AuthController.checkPassword(req, res);
    } catch (e) {
      console.log(e);
      res.json({ error: AuthController.errorTypes.error });
    }
  }
);

router.post(
  "/users/:userId/change-password",
  [
    check("password", AuthController.errorTypes.weakPassword).isLength({ min: 6 }),
    authMiddleware
  ],
  (req, res) => {
    try {
      AuthController.changePassword(req, res);
    } catch (e) {
      console.log(e);
      res.json({ error: AuthController.errorTypes.error });
    }
  }
);

// Новый роут для управления правами администратора
router.post("/set-admin/:userId", async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const user = await AuthController.setAdminStatus(req.params.userId, isAdmin);
    res.json({ user });
  } catch (e) {
    console.log(e);
    res.json({ error: AuthController.errorTypes.error });
  }
});

// Роут для получения данных пользователя
router.get("/users/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await AuthController.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json(user);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: AuthController.errorTypes.error });
  }
});

router.post('/users/visit-film', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { filmId } = req.body;
    if (!filmId) return res.status(400).json({ error: 'filmId required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Удаляем все дубли, добавляем новый id в начало, ограничиваем 20
    let arr = [filmId, ...user.visitedFilms.filter(id => id !== filmId)];
    // Очищаем дубли (на всякий случай)
    arr = arr.filter((id, idx) => arr.indexOf(id) === idx);
    user.visitedFilms = arr.slice(0, 20);
    await user.save();

    res.json({ success: true, visitedFilms: user.visitedFilms });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Поставить лайк/дизлайк и комментарий
router.post('/film-rating', authMiddleware, async (req, res) => {
  try {
    const { filmId, like, comment } = req.body;
    const userId = req.user.id;
    if (!filmId || typeof like !== 'boolean') return res.status(400).json({ error: 'filmId and like required' });

    // Обновляем или создаем рейтинг
    let rating = await FilmRating.findOne({ filmId, userId });
    if (!rating) {
      rating = new FilmRating({ filmId, userId, like, comment });
    } else {
      rating.like = like;
      rating.comment = comment;
      rating.createdAt = new Date();
    }
    await rating.save();

    // Обновляем likedFilms в модели User
    const user = await User.findById(userId);
    if (like) {
      // Если лайк, добавляем фильм в likedFilms
      if (!user.likedFilms.includes(filmId)) {
        user.likedFilms.push(filmId);
      }
    } else {
      // Если дизлайк, удаляем фильм из likedFilms
      user.likedFilms = user.likedFilms.filter(id => id !== filmId);
    }
    await user.save();

    res.json({ success: true, rating, user });
  } catch (error) {
    console.error('Error in film-rating:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить все оценки и комментарии по фильму
router.get('/film-rating/:filmId', async (req, res) => {
  const { filmId } = req.params;
  const ratings = await FilmRating.find({ filmId });
  
  // Получаем email'ы пользователей
  const ratingsWithEmails = await Promise.all(ratings.map(async (rating) => {
    const user = await User.findById(rating.userId);
    return {
      ...rating.toObject(),
      userEmail: user ? user.email : null
    };
  }));

  res.json({ ratings: ratingsWithEmails });
});

// Сохранить информацию о фильме
router.post('/films', async (req, res) => {
  try {
    const { kinopoiskId, nameRu, posterUrlPreview, posterUrl, year, genres, ratingKinopoisk, description, type, ratingAgeLimits } = req.body;
    
    if (!kinopoiskId || !nameRu) {
      return res.status(400).json({ error: 'kinopoiskId and nameRu are required' });
    }

    // Проверяем, существует ли уже такой фильм
    let film = await Film.findOne({ kinopoiskId });
    
    if (!film) {
      // Если фильма нет, создаем новый
      film = new Film({
        kinopoiskId,
        nameRu,
        posterUrlPreview,
        posterUrl,
        year,
        genres,
        ratingKinopoisk,
        description,
        type,
        ratingAgeLimits
      });
      await film.save();
    }

    res.json({ success: true, film });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить информацию о фильме
router.get('/films/:kinopoiskId', async (req, res) => {
  try {
    const film = await Film.findOne({ kinopoiskId: req.params.kinopoiskId });
    if (!film) {
      return res.status(404).json({ error: 'Film not found' });
    }
    res.json({ film });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Удалить комментарий (только для админов)
router.delete('/film-rating/:ratingId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const rating = await FilmRating.findById(req.params.ratingId);
    if (!rating) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }

    // Если это был лайкнутый фильм, удаляем его из likedFilms
    if (rating.like) {
      const userWhoRated = await User.findById(rating.userId);
      if (userWhoRated) {
        userWhoRated.likedFilms = userWhoRated.likedFilms.filter(id => id !== rating.filmId);
        await userWhoRated.save();
      }
    }

    await rating.deleteOne();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить все фильмы
router.get('/films', async (req, res) => {
  try {
    const films = await Film.find();
    res.json({ films });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновить отдельные поля фильма
router.patch('/films/:kinopoiskId', async (req, res) => {
  try {
    const kinopoiskId = req.params.kinopoiskId;
    const update = req.body;
    const film = await Film.findOneAndUpdate(
      { kinopoiskId },
      { $set: update },
      { new: true }
    );
    if (!film) {
      return res.status(404).json({ error: 'Film not found' });
    }
    res.json({ film });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Функция для расчета TF-IDF схожести текста
function calculateTFIDFSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  // Приводим к нижнему регистру и разбиваем на слова
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  // Создаем словари частот
  const freq1 = {};
  const freq2 = {};
  
  words1.forEach(word => freq1[word] = (freq1[word] || 0) + 1);
  words2.forEach(word => freq2[word] = (freq2[word] || 0) + 1);
  
  // Рассчитываем TF-IDF для каждого слова
  let similarity = 0;
  const allWords = new Set([...words1, ...words2]);
  
  allWords.forEach(word => {
    const tf1 = (freq1[word] || 0) / words1.length;
    const tf2 = (freq2[word] || 0) / words2.length;
    const idf = Math.log(2 / ((freq1[word] ? 1 : 0) + (freq2[word] ? 1 : 0)));
    similarity += tf1 * tf2 * idf;
  });
  
  return similarity;
}

// Функция для расчета схожести жанров с учетом весов
function calculateGenreSimilarity(genres1, genres2, genreWeights, isDislike = false) {
  if (!genres1 || !genres2) return 0;
  
  const genreNames1 = genres1.map(g => g.genre);
  const genreNames2 = genres2.map(g => g.genre);
  
  let similarity = 0;
  let totalWeight = 0;
  
  genreNames1.forEach(genre => {
    if (genreNames2.includes(genre)) {
      const weight = genreWeights.get(genre) || 1;
      similarity += weight;
      totalWeight += weight;
    }
  });
  
  const result = totalWeight > 0 ? similarity / totalWeight : 0;
  return isDislike ? -result : result;
}

// Функция для расчета схожести годов с учетом жанров
function calculateYearSimilarity(year1, year2, genre1, genre2, genreYearPreferences, isDislike = false) {
  if (!year1 || !year2) return 0;
  
  const diff = Math.abs(year1 - year2);
  let similarity = 0;
  
  // Базовое сходство по годам
  if (diff <= 2) similarity = 1;
  else if (diff <= 5) similarity = 0.7;
  else if (diff <= 10) similarity = 0.3;
  
  // Учитываем предпочтения по жанрам
  if (genre1 && genre2) {
    const genre1Prefs = genreYearPreferences.get(genre1);
    const genre2Prefs = genreYearPreferences.get(genre2);
    
    if (genre1Prefs && genre2Prefs) {
      const year1Score = genre1Prefs.find(p => Math.abs(p.year - year1) <= 5)?.count || 0;
      const year2Score = genre2Prefs.find(p => Math.abs(p.year - year2) <= 5)?.count || 0;
      
      if (year1Score > 0 && year2Score > 0) {
        similarity *= 1.5;
      }
    }
  }
  
  return isDislike ? -similarity : similarity;
}

// Функция для нахождения похожих пользователей
async function findSimilarUsers(userId, userRatings) {
  const allUsers = await User.find({ _id: { $ne: userId } });
  const similarUsers = [];

  for (const otherUser of allUsers) {
    const otherUserRatings = await FilmRating.find({ userId: otherUser._id });
    
    // Находим общие фильмы
    const commonFilms = userRatings.filter(r1 => 
      otherUserRatings.some(r2 => r2.filmId === r1.filmId)
    );

    if (commonFilms.length > 0) {
      // Считаем схожесть оценок
      let similarity = 0;
      commonFilms.forEach(r1 => {
        const r2 = otherUserRatings.find(r => r.filmId === r1.filmId);
        if (r1.like === r2.like) similarity += 1;
        else similarity -= 1;
      });

      similarity = similarity / commonFilms.length;
      if (similarity > 0) {
        similarUsers.push({
          user: otherUser,
          similarity,
          ratings: otherUserRatings
        });
      }
    }
  }

  return similarUsers.sort((a, b) => b.similarity - a.similarity);
}

// Функция для расчета косинусного сходства
function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
}

// Функция для создания вектора признаков фильма
function createFeatureVector(film) {
  const features = [];
  
  // Жанры (one-hot encoding)
  const allGenres = ['драма', 'комедия', 'боевик', 'фантастика', 'ужасы', 'приключения', 'мультфильм', 'фэнтези', 'триллер', 'мелодрама'];
  allGenres.forEach(genre => {
    features.push(film.genres.some(g => g.genre.toLowerCase() === genre) ? 1 : 0);
  });

  // Год (нормализованный)
  const currentYear = new Date().getFullYear();
  features.push((film.year - 1900) / (currentYear - 1900));

  // Рейтинг (нормализованный)
  features.push((film.ratingKinopoisk || 0) / 10);

  // Тип (one-hot encoding)
  features.push(film.type === 'FILM' ? 1 : 0);
  features.push(film.type === 'TV_SERIES' ? 1 : 0);

  return features;
}

// Функция для получения рекомендаций на основе косинусного сходства
async function getCosineSimilarityRecommendations(userId, userFilms, allFilms) {
  // Создаем профиль пользователя на основе его лайкнутых фильмов
  const userProfile = userFilms.reduce((profile, film) => {
    const features = createFeatureVector(film);
    return profile.map((val, i) => val + features[i]);
  }, new Array(14).fill(0));

  // Нормализуем профиль пользователя
  const magnitude = Math.sqrt(userProfile.reduce((sum, val) => sum + val * val, 0));
  const normalizedProfile = userProfile.map(val => val / magnitude);

  // Рассчитываем сходство для каждого фильма
  const similarities = allFilms.map(film => {
    const features = createFeatureVector(film);
    const similarity = cosineSimilarity(normalizedProfile, features);
    return {
      film,
      similarity
    };
  });

  // Сортируем по сходству и возвращаем топ рекомендации
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 30)
    .map(item => ({
      ...item.film.toObject(),
      similarityScore: item.similarity
    }));
}

// Обновляем роут рекомендаций
router.get('/users/:userId/recommendations', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.json({ recommendations: [] });
    }

    // Получаем все фильмы пользователя
    const userFilmIds = [...new Set([...user.likedFilms])];
    const visitedFilmIds = new Set(user.visitedFilms);
    
    if (!userFilmIds.length) {
      return res.json({ recommendations: [] });
    }

    const userFilms = await Film.find({ kinopoiskId: { $in: userFilmIds } });
    if (!userFilms.length) {
      return res.json({ recommendations: [] });
    }

    // Получаем все доступные фильмы, исключая посещенные и лайкнутые
    const allFilms = await Film.find({
      kinopoiskId: { 
        $nin: [...userFilmIds, ...Array.from(visitedFilmIds)]
      },
      posterUrlPreview: { $exists: true, $ne: null }
    });

    // Получаем рекомендации на основе косинусного сходства
    const recommendations = await getCosineSimilarityRecommendations(
      user._id,
      userFilms,
      allFilms
    );

    // Разделяем фильмы и сериалы
    const films = recommendations.filter(f => f.type === 'FILM');
    const series = recommendations.filter(f => f.type === 'TV_SERIES');

    // Чередуем фильмы и сериалы
    const alternatedRecommendations = [];
    const maxLength = Math.max(films.length, series.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < films.length) {
        alternatedRecommendations.push(films[i]);
      }
      if (i < series.length) {
        alternatedRecommendations.push(series[i]);
      }
    }

    res.json({
      recommendations: alternatedRecommendations,
      stats: {
        likedFilmsCount: user.likedFilms.length,
        visitedFilmsCount: user.visitedFilms.length,
        totalFilmsAnalyzed: allFilms.length,
        similarityScores: alternatedRecommendations.map(f => ({
          title: f.nameRu,
          type: f.type,
          score: f.similarityScore,
          rating: f.ratingKinopoisk,
          year: f.year,
          genres: f.genres.map(g => g.genre)
        }))
      }
    });
  } catch (error) {
    console.error('Error in recommendations:', error);
    res.json({ recommendations: [] });
  }
});

module.exports = router;
