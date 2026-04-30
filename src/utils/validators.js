import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')

export const phoneSchema = z
  .string()
  .min(10, 'Enter a valid phone number')
  .regex(/^\+?[\d\s\-().]{10,}$/, 'Invalid phone number')

export const urlSchema = z.preprocess(
  val => {
    if (typeof val !== 'string' || val.trim() === '') return val
    const trimmed = val.trim()
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
    return trimmed
  },
  z.string().url('Enter a valid website URL').optional().or(z.literal(''))
)

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
  phone: z.string().optional().or(z.literal('')),
  website: urlSchema,
  address: z.string().optional(),
  city: z.string().min(1, 'City required'),
  state: z.string().min(1, 'State required'),
  zip: z.string().min(4, 'ZIP required'),
  niche: z.string().min(1, 'Please select your niche'),
  tagline: z.string().max(100).optional(),
  currentOffer: z.string().max(100).optional(),
  // Phase 1 Citations fields (optional in Profile, required in CitationsSetup)
  businessHours: z.string().optional(),
  description: z.string().optional(),
})

// Citations Setup - Phase 2/3 comprehensive form
export const citationsSetupSchema = z.object({
  // Basic Info (Phase 1)
  businessName: z.string().min(2, 'Business name required'),
  phone: phoneSchema,
  website: urlSchema,
  address: z.string().min(3, 'Address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),

  // Step 1 - Hours, Category & Description
  businessHours: z.string().min(1, 'Business hours required'),
  category: z.string().optional(),
  description: z.string().min(10, 'Description at least 10 characters').max(500, 'Max 500 characters'),

  // Phase 2 - Full Submission
  shortDesc: z.string().max(160, 'Max 160 characters').optional(),
  longDesc: z.string().max(2000, 'Max 2000 characters').optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  tiktok: z.string().url().optional().or(z.literal('')),

  // Phase 3 - Optimization (all optional)
  serviceAreas: z.string().optional(),
  yearEstablished: z.string().optional(),
  serviceCategories: z.array(z.string()).optional(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  certifications: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(),
})
