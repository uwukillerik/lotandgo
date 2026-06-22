import { z } from "zod";
import { LOT_CATEGORIES } from "./categories";
import { isValidRuPhone, normalizeRuPhone } from "./validation";

const phoneSchema = z
  .string()
  .optional()
  .refine((v) => !v?.trim() || isValidRuPhone(v), {
    message: "Телефон: +7 9XX XXX-XX-XX или 8 9XX XXX-XX-XX",
  })
  .transform((v) => (v?.trim() ? normalizeRuPhone(v.trim()) : undefined));

const passwordSchema = z
  .string()
  .min(8, "Пароль минимум 8 символов")
  .regex(/[a-zA-Zа-яА-Я]/, "Добавьте хотя бы одну букву")
  .regex(/\d/, "Добавьте хотя бы одну цифру");

export const registerSchema = z
  .object({
    email: z.string().email("Некорректный email"),
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().min(2, "Имя минимум 2 символа"),
    phone: phoneSchema,
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Примите пользовательское соглашение и оферту" }),
    }),
    acceptPrivacy: z.literal(true, {
      errorMap: () => ({ message: "Дайте согласие на обработку персональных данных" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const createLotSchema = z.object({
  title: z.string().min(3, "Название минимум 3 символа"),
  description: z.string().min(10, "Описание минимум 10 символов"),
  category: z.enum(LOT_CATEGORIES),
});

export const createAuctionSchema = z.object({
  lotId: z.string().uuid(),
  startPrice: z.coerce.number().positive("Начальная цена должна быть > 0"),
  bidStep: z.coerce.number().positive("Шаг ставки должен быть > 0"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  auctionType: z.enum(["fixed", "anti_snipe", "soft_close"]).optional().default("anti_snipe"),
  holdDurationSeconds: z.coerce.number().int().min(60).max(7 * 24 * 3600).optional(),
});

export const placeBidSchema = z.object({
  amount: z.coerce.number().positive("Ставка должна быть > 0"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Имя минимум 2 символа").optional(),
  phone: z
    .string()
    .nullable()
    .optional()
    .refine((v) => v == null || !String(v).trim() || isValidRuPhone(String(v)), {
      message: "Телефон: +7 9XX XXX-XX-XX или 8 9XX XXX-XX-XX",
    })
    .transform((v) => {
      if (v == null || !String(v).trim()) return null;
      return normalizeRuPhone(String(v).trim());
    }),
  emailNotifications: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateLotInput = z.infer<typeof createLotSchema>;
export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
export type PlaceBidInput = z.infer<typeof placeBidSchema>;
