import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

// 安全なJSONパース（DoS対策）
const MAX_JSON_SIZE = 10 * 1024 // 10KB

function safeJsonParse(jsonString, defaultValue = {}) {
  if (!jsonString) return defaultValue
  if (jsonString.length > MAX_JSON_SIZE) {
    console.warn('JSON string too large, returning default value')
    return defaultValue
  }
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('Failed to parse JSON:', error.message)
    return defaultValue
  }
}

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
    editorPrefs: safeJsonParse(row.editor_prefs),
    workspacePrefs: safeJsonParse(row.workspace_prefs),
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

// UUIDバリデーション
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id)
}

export function createProjectsRepository({ dataDir, databasePath }) {
  const resolvedDataDir = dataDir || path.resolve('data')
  const resolvedDatabasePath = databasePath || path.join(resolvedDataDir, 'projects.db')

  // データディレクトリの作成（セキュアなパーミッションで）
  fs.mkdirSync(resolvedDataDir, { recursive: true, mode: 0o700 })

  const db = new Database(resolvedDatabasePath)
  
  // データベースファイルのパーミッションを制限（ owner only: rw------- ）
  try {
    fs.chmodSync(resolvedDatabasePath, 0o600)
  } catch (error) {
    console.warn('Could not set database file permissions:', error.message)
  }
  
  // WALモード設定（パフォーマンスと安全性のバランス）
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')

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
      // IDのバリデーション
      if (!isValidUUID(id)) {
        throw new Error('Invalid project ID format')
      }
      
      const now = new Date().toISOString()
      const result = db.prepare(
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
      
      // 更新が成功したか確認
      if (result.changes === 0) {
        return null
      }
      
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
      return row ? mapRow(row) : null
    },

    listByOwner(ownerKeyHash, { limit = 100, offset = 0 } = {}) {
      // パラメータのバリデーション
      const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200))
      const safeOffset = Math.max(0, Math.min(Number(offset) || 0, 10000))
      
      const rows = db
        .prepare('SELECT id, title, created_at, updated_at FROM projects WHERE owner_key_hash = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?')
        .all(ownerKeyHash, safeLimit, safeOffset)
      return rows.map(mapListRow)
    },

    getById(id) {
      // IDのバリデーション
      if (!isValidUUID(id)) {
        return null
      }
      
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
      if (!row) return null
      return {
        ownerKeyHash: row.owner_key_hash,
        project: mapRow(row),
      }
    },

    delete(id) {
      // IDのバリデーション
      if (!isValidUUID(id)) {
        return false
      }
      
      const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id)
      return result.changes > 0
    },
  }
}
