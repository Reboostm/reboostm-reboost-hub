import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')

export const phoneSchema = z
  .string()
  .min(10, 'Enter a valid phone number')
  .regex(/^\+?[\d\s\-().]{10,}$/, 'Invalid phone number')

export const urlSchema = z
  .string()
  .url('Enter a valid URL (include https://)')
  .optional()
  .or(z.literal(''))

// Auth
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signupStep1Schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const signupStep2Schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  phone: phoneSchema,
  website: urlSchema,
  address: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(5, 'ZIP code is required'),
})

export const signupStep3Schema = z.object({
  niche: z.string().min(1, 'Please select your business type'),
  tagline: z.string().max(100).optional(),
  currentOffer: z.string().max(100).optional(),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

// Profile
export const profileSchema = z.object({
  displayName: z.string().min(2, 'Name required'),
  businessName: z.string().min(2, 'Business name required'),
  phone: phoneSchema,
  website: urlSchema,
  address: z.string().optional(),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  zip: z.string().min(5, 'ZIP required'),
  niche: z.string().min(1, 'Please select your niche'),
  tagline: z.string().max(100).optional(),
  currentOffer: z.string().max(100).optional(),
})
