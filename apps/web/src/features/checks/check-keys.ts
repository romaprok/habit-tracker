export const checkKeys = {
  all: ['checks'] as const,
  range: (from: string, to: string) => ['checks', from, to] as const,
}
