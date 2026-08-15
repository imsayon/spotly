import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const RoleEnum = z.enum(["CONSUMER", "MERCHANT", "ADMIN"]);
export type Role = z.infer<typeof RoleEnum>;

export const QueueStatusEnum = z.enum([
  "PENDING_ACCEPTANCE",
  "WAITING",
  "CALLED",
  "SERVED",
  "MISSED",
  "CANCELLED",
]);
export type QueueStatus = z.infer<typeof QueueStatusEnum>;

// ─── Domain Entity Schemas ───────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  name: z.string().nullable().optional(),
  role: RoleEnum.default("CONSUMER"),
  secondaryPhone: z.string().nullable().optional(),
  isPhoneVerified: z.boolean().default(false),
  location: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type User = z.infer<typeof UserSchema>;

export const MerchantSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string(),
  name: z.string().min(1, "Merchant name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().nullable().optional(),
  verified: z.boolean().default(false),
  contactEmail: z.string().email().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  foundingYear: z.number().int().nullable().optional(),
  gstNumber: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  spotId: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type Merchant = z.infer<typeof MerchantSchema>;

export const OutletSchema = z.object({
  id: z.string().uuid(),
  merchantId: z.string().uuid(),
  name: z.string().min(1, "Outlet name is required"),
  address: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  isActive: z.boolean().default(true),
  openTime: z.string().default("09:00"),
  closeTime: z.string().default("21:00"),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type Outlet = z.infer<typeof OutletSchema>;

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative("Price must be >= 0"),
  image: z.string().url().nullable().optional(),
  isAvailable: z.boolean().default(true),
  order: z.number().int().default(0),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const MenuCategorySchema = z.object({
  id: z.string().uuid(),
  outletId: z.string().uuid(),
  name: z.string().min(1, "Category name is required"),
  order: z.number().int().default(0),
  items: z.array(MenuItemSchema).optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type MenuCategory = z.infer<typeof MenuCategorySchema>;

export const QueueEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  outletId: z.string().uuid(),
  status: QueueStatusEnum,
  tokenNumber: z.number().int(),
  calledAt: z.string().or(z.date()).nullable().optional(),
  servedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type QueueEntry = z.infer<typeof QueueEntrySchema>;

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  outletId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
});
export type Review = z.infer<typeof ReviewSchema>;

export const FavoriteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  outletId: z.string().uuid(),
  createdAt: z.string().or(z.date()),
});
export type Favorite = z.infer<typeof FavoriteSchema>;

// ─── Input DTO Schemas ────────────────────────────────────────────────────────

export const UpdateUserProfileDtoSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type UpdateUserProfileDto = z.infer<typeof UpdateUserProfileDtoSchema>;

export const CreateMerchantDtoSchema = z.object({
  name: z.string().min(1, "Merchant name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  contactEmail: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  foundingYear: z.number().int().optional(),
  gstNumber: z.string().optional(),
  website: z.string().url().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  spotId: z.string().optional(),
});
export type CreateMerchantDto = z.infer<typeof CreateMerchantDtoSchema>;

export const UpdateMerchantDtoSchema = CreateMerchantDtoSchema.partial();
export type UpdateMerchantDto = z.infer<typeof UpdateMerchantDtoSchema>;

export const CreateOutletDtoSchema = z.object({
  merchantId: z.string().uuid(),
  name: z.string().min(1, "Outlet name is required"),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});
export type CreateOutletDto = z.infer<typeof CreateOutletDtoSchema>;

export const UpdateOutletDtoSchema = CreateOutletDtoSchema.omit({ merchantId: true }).partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateOutletDto = z.infer<typeof UpdateOutletDtoSchema>;

export const JoinQueueDtoSchema = z.object({
  outletId: z.string().uuid(),
});
export type JoinQueueDto = z.infer<typeof JoinQueueDtoSchema>;

export const CreateMenuCategoryDtoSchema = z.object({
  outletId: z.string().uuid(),
  name: z.string().min(1),
  order: z.number().int().optional(),
});
export type CreateMenuCategoryDto = z.infer<typeof CreateMenuCategoryDtoSchema>;

export const CreateMenuItemDtoSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  image: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
  order: z.number().int().optional(),
});
export type CreateMenuItemDto = z.infer<typeof CreateMenuItemDtoSchema>;

export const CreateReviewDtoSchema = z.object({
  outletId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});
export type CreateReviewDto = z.infer<typeof CreateReviewDtoSchema>;

// ─── Response Envelope Schemas ───────────────────────────────────────────────

export const ResponseMetaSchema = z.object({
  requestId: z.string(),
  timestamp: z.string(),
  pagination: z
    .object({
      nextCursor: z.string().optional(),
      hasMore: z.boolean().optional(),
    })
    .optional(),
});
export type ResponseMeta = z.infer<typeof ResponseMetaSchema>;

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: ResponseMetaSchema,
  });

export const ApiErrorDetailsSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
});

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ApiErrorDetailsSchema).optional(),
  }),
  meta: ResponseMetaSchema,
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// ─── WebSocket Event Payloads ─────────────────────────────────────────────────

export const QueueUpdatePayloadSchema = z.object({
  outletId: z.string().uuid(),
  entries: z.array(QueueEntrySchema),
  currentToken: z.number().int(),
});
export type QueueUpdatePayload = z.infer<typeof QueueUpdatePayloadSchema>;

export const TokenCalledPayloadSchema = z.object({
  outletId: z.string().uuid(),
  tokenNumber: z.number().int(),
});
export type TokenCalledPayload = z.infer<typeof TokenCalledPayloadSchema>;
