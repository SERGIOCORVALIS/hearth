type MemberLike = {
  id: string;
  name: string;
  role: "adult" | "child" | "elder";
};

const ROLE_ALIASES: Record<string, MemberLike["role"]> = {
  elder: "elder",
  grandma: "elder",
  grandpa: "elder",
  grandparent: "elder",
  child: "child",
  kid: "child",
  kids: "child",
  adult: "adult",
  parent: "adult",
  parents: "adult",
};

/**
 * Resolve a member reference from an MCP tool argument.
 * Accepts member id, role alias (`elder` / `child` / `adult` / `grandma`), or display name.
 */
export function resolveMember<T extends MemberLike>(
  members: T[],
  ref: string,
  options: { fallbackRole?: MemberLike["role"] } = {},
): T | undefined {
  const key = ref.trim();
  if (!key) return undefined;

  const byId = members.find((m) => m.id === key);
  if (byId) return byId;

  const role = ROLE_ALIASES[key.toLowerCase()];
  if (role) {
    const byRole = members.find((m) => m.role === role);
    if (byRole) return byRole;
  }

  const lower = key.toLowerCase();
  const byExactName = members.find((m) => m.name.toLowerCase() === lower);
  if (byExactName) return byExactName;
  // "Elena" matches "Elena (Grandma)"; avoid tiny substrings.
  if (lower.length >= 3) {
    const byPartialName = members.find((m) => {
      const name = m.name.toLowerCase();
      return name.startsWith(lower) || name.includes(` ${lower}`) || name.includes(`(${lower}`);
    });
    if (byPartialName) return byPartialName;
  }

  if (options.fallbackRole) {
    return members.find((m) => m.role === options.fallbackRole);
  }

  return undefined;
}

export function resolveMemberOrThrow<T extends MemberLike>(
  members: T[],
  ref: string,
  options: { fallbackRole?: MemberLike["role"] } = {},
): T {
  const member = resolveMember(members, ref, options);
  if (!member) {
    throw new Error(
      `Unknown memberId: ${ref}. Use a member id, role (elder|child|adult), or display name.`,
    );
  }
  return member;
}
