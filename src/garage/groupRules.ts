export const MAX_GROUP_MEMBERS = 4;
export type LocalGroup = {
  id: string;
  host: string;
  members: string[];
  revision: number;
};
export function validGroup(raw: unknown): raw is LocalGroup {
  const g = raw as LocalGroup | null;
  return (
    !!g &&
    typeof g.id === "string" &&
    g.id.length <= 80 &&
    typeof g.host === "string" &&
    Number.isSafeInteger(g.revision) &&
    g.revision >= 1 &&
    Array.isArray(g.members) &&
    g.members.length >= 2 &&
    g.members.length <= MAX_GROUP_MEMBERS &&
    g.members.every(
      (id) => typeof id === "string" && id.length > 0 && id.length <= 80,
    ) &&
    new Set(g.members).size === g.members.length &&
    g.members[0] === g.host
  );
}
export function canAddMember(group: LocalGroup | null, pending: boolean) {
  return !pending && (!group || group.members.length < MAX_GROUP_MEMBERS);
}
