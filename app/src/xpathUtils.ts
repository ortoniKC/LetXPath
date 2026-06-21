export function escapeXpathString(str: string): string {
  if (!str.includes("'")) {
    return `'${str}'`;
  }
  if (!str.includes('"')) {
    return `"${str}"`;
  }
  // If it contains both single and double quotes, split and concatenate
  const parts = str.split("'");
  return "concat(" + parts.map((part) => `'${part}'`).join(', "\'", ') + ")";
}
