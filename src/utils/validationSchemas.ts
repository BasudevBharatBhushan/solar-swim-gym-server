import { z } from 'zod';

const caseManagerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

const primaryProfileSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  rceb_flag: z.boolean(),
  case_manager: caseManagerSchema.optional(),
});

const familyMemberSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  email: z.string().email().optional().or(z.literal('')),
  rceb_flag: z.boolean(),
  services: z.array(z.string().uuid()).optional(),
});

export const onboardingSchema = z.object({
  body: z.object({
    primary_profile: primaryProfileSchema,
    family_members: z.array(familyMemberSchema),
  }),
});
