import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const repos = sqliteTable('repos', {
  id: integer('id').primaryKey(),
  node_id: text('node_id').notNull(),
  full_name: text('full_name').notNull().unique(),
  private: integer('private').notNull(),
  indexed: integer('indexed').notNull().default(0),
  indexCursor: integer('index_cursor').notNull().default(0),
})

export const issues = sqliteTable('issues', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  repoId: integer('repo_id').notNull().references(() => repos.id),
  title: text('title').notNull(),
  state: text('state').notNull(),
  number: integer('number').notNull(),
  metadata: text('metadata').notNull(),
  embeddings: text('embeddings').notNull(),
  hash: text('hash').notNull(),
  mtime: integer('mtime').notNull(),
}, table => [
  index('idx_repo_id_number').on(table.repoId, table.number),
  index('idx_state').on(table.state),
])

export const dashboards = sqliteTable('dashboards', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  githubId: integer('github_id').notNull(),
  githubLogin: text('github_login'),
  createdAt: integer('created_at').notNull(),
}, table => [
  uniqueIndex('idx_dashboards_github_slug').on(table.githubId, table.slug),
])

export const dashboardRepos = sqliteTable('dashboard_repos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dashboardId: text('dashboard_id').notNull().references(() => dashboards.id, { onDelete: 'cascade' }),
  repoId: integer('repo_id').notNull().references(() => repos.id),
}, table => [
  index('idx_dashboard_repos_dashboard').on(table.dashboardId),
  uniqueIndex('idx_dashboard_repos_unique').on(table.dashboardId, table.repoId),
])
