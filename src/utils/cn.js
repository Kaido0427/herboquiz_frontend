/** Concatenation de classes conditionnelles, sans dependance. */
export function cn(...parts) {
  return parts.flat().filter(Boolean).join(' ')
}
