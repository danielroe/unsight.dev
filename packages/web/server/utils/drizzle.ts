import { db, schema } from 'hub:db'

export { and, eq, inArray, or, sql } from 'drizzle-orm'

export const tables = schema

export function useDrizzle() {
  return db
}
