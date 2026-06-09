import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Слишком много попыток. Попробуйте через минуту." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bidLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Слишком много ставок. Подождите немного." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
