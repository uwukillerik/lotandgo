import { z } from "zod";
import { LOT_CATEGORIES } from "./categories";

export const registerSchema = z
  .object({
    email: z.string().email("Некорректный email"),
    password: z.string().min(8, "Пароль минимум 8 символов"),
    confirmPassword: z.string(),
    name: z.string().min(2, "Имя минимум 2 символа"),
    phone: z.string().min(10, "Укажите телефон").optional(),
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
});

export const placeBidSchema = z.object({
  amount: z.coerce.number().positive("Ставка должна быть > 0"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Имя минимум 2 символа").optional(),
  phone: z.string().min(10, "Укажите телефон").optional().nullable(),
  emailNotifications: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z.string().min(8, "Новый пароль минимум 8 символов"),
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
