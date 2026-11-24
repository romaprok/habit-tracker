import { argon2id, hash, verify } from 'argon2'

export function hashPassword(password: string): Promise<string> {
  return hash(password, { type: argon2id })
}

export function verifyPassword(
  hashed: string,
  password: string,
): Promise<boolean> {
  return verify(hashed, password)
}
