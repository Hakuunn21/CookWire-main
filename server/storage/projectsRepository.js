import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    files: {
      html: row.html,
      css: row.css,
      js: row.js,
    },
    language: row.language,
    theme: row.theme,
    editorPrefs: JSON.parse(row.editor_prefs || '{}'),
    workspacePrefs: JSON.parse(row.workspace_prefs || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapListRow(row) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createProjectsRepository({ dataDir, databasePath }) {
  const resolvedDataDir = dataDir || path.resolve('data')
  const resolvedDatabasePath = databasePath || path.join(resolvedDataDir, 'projects.db')

  fs.mkdirSync(resolvedDataDir, { recursive: true })

  const db = new Database(resolvedDatabasePath)
  db.pragma('journal_mode = WAL')

  db.prepare(
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      owner_key_hash TEXT NOT NULL,
      title TEXT NOT NULL,
      html TEXT NOT NULL,
      css TEXT NOT NULL,
      js TEXT NOT NULL,
      language TEXT NOT NULL,
      theme TEXT NOT NULL,
      editor_prefs TEXT NOT NULL,
      workspace_prefs TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  ).run()

  db.prepare('CREATE INDEX IF NOT EXISTS idx_projects_owner_updated ON projects(owner_key_hash, updated_at DESC)').run()

  return {
    create({ ownerKeyHash, payload }) {
      const id = randomUUID()
      const now = new Date().toISOString()
      db.prepare(
        `INSERT INTO projects (
          id, owner_key_hash, title, html, css, js, language, theme, editor_prefs, workspace_prefs, created_at, updated_at
        ) VALUES (
          @id, @owner_key_hash, @title, @html, @css, @js, @language, @theme, @editor_prefs, @workspace_prefs, @created_at, @updated_at
        )`,
      ).run({
        id,
        owner_key_hash: ownerKeyHash,
        title: payload.title,
        html: payload.files.html,
        css: payload.files.css,
        js: payload.files.js,
        language: payload.language,
        theme: payload.theme,
        editor_prefs: JSON.stringify(payload.editorPrefs),
        workspace_prefs: JSON.stringify(payload.workspacePrefs),
        created_at: now,
        updated_at: now,
      })
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
      return mapRow(row)
    },

    update({ id, payload }) {
      const now = new Date().toISOString()
      db.prepare(
        `UPDATE projects SET
          title = @title,
          html = @html,
          css = @css,
          js = @js,
          language = @language,
          theme = @theme,
          editor_prefs = @editor_prefs,
          workspace_prefs = @workspace_prefs,
          updated_at = @updated_at
        WHERE id = @id`,
      ).run({
        id,
        title: payload.title,
        html: payload.files.html,
        css: payload.files.css,
        js: payload.files.js,
        language: payload.language,
        theme: payload.theme,
        editor_prefs: JSON.stringify(payload.editorPrefs),
        workspace_prefs: JSON.stringify(payload.workspacePrefs),
        updated_at: now,
      })
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
      return row ? mapRow(row) : null
    },

    listByOwner(ownerKeyHash, { limit = 100, offset = 0 } = {}) {
      const rows = db
        .prepare('SELECT id, title, created_at, updated_at FROM projects WHERE owner_key_hash = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?')
        .all(ownerKeyHash, limit, offset)
      return rows.map(mapListRow)
    },

    getById(id) {
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
      if (!row) return null
      return {
        ownerKeyHash: row.owner_key_hash,
        project: mapRow(row),
      }
    },
  }
}
