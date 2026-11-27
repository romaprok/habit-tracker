export const statsKeys = {
  all: ['stats'] as const,
  streaks: () => [...statsKeys.all, 'streaks'] as const,
  habit: (id: string) => [...statsKeys.all, 'habit', id] as const,
}
