import { z } from "zod";

export const HouseholdMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["adult", "child", "elder"]),
  preferences: z.array(z.string()),
  constraints: z.array(z.string()),
});

export const HouseholdProfileSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().min(1),
  timezone: z.string().min(1),
  members: z.array(HouseholdMemberSchema).min(1),
  sharedPreferences: z.array(z.string()),
  accessibilityNotes: z.array(z.string()),
});

export type HouseholdProfileParsed = z.infer<typeof HouseholdProfileSchema>;

/** Parse + validate household JSON (throws ZodError on bad shapes). */
export function parseHouseholdProfile(raw: unknown, source = "household"): HouseholdProfileParsed {
  const result = HouseholdProfileSchema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid household profile (${source}): ${detail}`);
  }
  return result.data;
}
