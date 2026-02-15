/* global process */
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { z } from 'zod'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createProjectsRepository } from './storage/projectsRepository.js'
import { requireOwner } from './middleware/auth.js'
import { validateEnv } from './security/envValidator.js'
import { csrfCookieMiddleware, csrfProtectionMiddleware, getCsrfToken, CSRF_HEADER } from './security/csrf.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数のバリデーション
const env = validateEnv()

const PORT = env.PORT
const CORS_ALLOW_ORIGINS = env.CORS_ALLOW_ORIGINS
const DATA_DIR = env.DATA_DIR
const DATABASE_PATH = env.DATABASE_PATH
const NODE_ENV = env.NODE_ENV
const TRUST_PROXY = env.TRUST_PROXY

const app = express()

// 最優先のデバッグ用ルート（ポート疎通確認用）
app.get('/debug-ping', (req, res) => res.send('pong'))

// Trust Proxy設定（レート制限の正確性のため）
// 本番環境ではプロキシを信頼する必要がある場合がある
if (TRUST_PROXY === 'true') {
  app.set('trust proxy', 1)
}

// Cookie parser for CSRF protection
app.use(cookieParser())

const repository = createProjectsRepository({ dataDir: DATA_DIR, databasePath: DATABASE_PATH })

// セキュリティヘッダー
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // 'unsafe-inline' and 'unsafe-eval' are required for the code editor functionality
      // This is a necessary trade-off for this type of application
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"], // クリックジャッキング対策
      upgradeInsecureRequests: [],
      // Additional security directives
      manifestSrc: ["'self'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'none'"], // Disable workers for security
    },
  },
  crossOriginEmbedderPolicy: false, // SPAの互換性のため
  crossOriginResourcePolicy: { policy: 'same-origin' }, // Restricted from cross-origin
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' }, // X-Frame-Options
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true, // X-Content-Type-Options
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}))

// CORS設定
const allowedOrigins = CORS_ALLOW_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
const corsOrigin = allowedOrigins.includes('*') ? '*' : allowedOrigins

app.use(cors({
  origin: corsOrigin,
  credentials: true, // Required for CSRF cookie
  allowedHeaders: ['Content-Type', 'X-CookWire-Owner-Key', 'x-csrf-token'],
}))
app.use(express.json({ limit: '2mb' }))

// CSRF cookie middleware - sets CSRF token for all requests
app.use(csrfCookieMiddleware)

// ログ設定（センシティブデータを除去）
const isProduction = NODE_ENV === 'production'
morgan.token('body', (req) => {
  // リクエストボディからセンシティブデータをマスク
  if (req.body && typeof req.body === 'object') {
    const masked = { ...req.body }
    // 機密フィールドをマスク
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']
    sensitiveFields.forEach(field => {
      if (field in masked) {
        masked[field] = '[REDACTED]'
      }
    })
    return JSON.stringify(masked).substring(0, 500) // 長さ制限
  }
  return ''
})

// カスタムログフォーマット
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  skip: (req) => req.path === '/health', // ヘルスチェックはログから除外
}))

// レート制限設定（信頼できるプロキシの設定を含む）
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 15分間に100リクエスト
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
  skip: (req) => req.path === '/health', // ヘルスチェックは除外
})

// 静的ファイル配信（本番環境用）
const distPath = path.resolve(__dirname, '..', 'dist')

// 起動時の診断ログ
console.log(`[Diagnostic] Server starting...`)
console.log(`[Diagnostic] __dirname: ${__dirname}`)
console.log(`[Diagnostic] distPath: ${distPath}`)
if (fs.existsSync(distPath)) {
  console.log(`[Diagnostic] dist directory found.`)
  const files = fs.readdirSync(distPath)
  console.log(`[Diagnostic] dist contents: ${files.join(', ')}`)
} else {
  console.error(`[Diagnostic] dist directory NOT FOUND at ${distPath}`)
}

// パストラバーサル対策付きの安全なファイル配信
app.use(express.static(distPath, {
  dotfiles: 'deny', // 隠しファイルは拒否
  setHeaders: (res, filePath) => {
    // キャッシュ制御（センシティブなデータを含む可能性がある）
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }
  },
}))

// 入力バリデーションスキーマ
const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  files: z.object({
    html: z.string().max(200_000),
    css: z.string().max(200_000),
    js: z.string().max(200_000),
  }),
  language: z.enum(['ja', 'en']),
  theme: z.enum(['dark', 'light']),
  editorPrefs: z.object({
    fontSize: z.number().min(12).max(20),
    lineHeight: z.number().min(1.2).max(2.1),
    autoPreview: z.boolean(),
  }),
  workspacePrefs: z.object({
    previewMode: z.enum(['desktop', 'mobile']),
  }),
})

// UUIDバリデーションスキーマ
const uuidSchema = z.string().uuid()

// ヘルスチェック（レート制限対象外）
app.get('/health', (req, res) => {
  // 最小限の情報のみ返す（情報漏洩対策）
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  return res.json({ ok: true })
})

// CSRF Token endpoint
app.get('/api/csrf-token', standardLimiter, getCsrfToken)

// 許可されていないHTTPメソッドのブロック
app.all('/api/(.*)', (req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  next()
})

// CSRF Protection for state-changing routes
app.use('/api', csrfProtectionMiddleware)

// プロジェクトAPI（標準レート制限）
app.get('/api/projects', standardLimiter, requireOwner, (req, res) => {
  const { ownerKeyHash } = req
  const rawLimit = Number.parseInt(req.query.limit, 10)
  const rawOffset = Number.parseInt(req.query.offset, 10)
  const limit = Number.isNaN(rawLimit) ? 50 : Math.max(1, Math.min(rawLimit, 200))
  const offset = Number.isNaN(rawOffset) ? 0 : Math.max(0, rawOffset)

  try {
    const data = repository.listByOwner(ownerKeyHash, { limit, offset })
    return res.json({ data })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

app.get('/api/projects/:id', standardLimiter, requireOwner, (req, res) => {
  const { ownerKeyHash } = req

  // IDのバリデーション
  const idValidation = uuidSchema.safeParse(req.params.id)
  if (!idValidation.success) {
    return res.status(400).json({ error: 'Invalid project ID format' })
  }

  try {
    const row = repository.getById(req.params.id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    if (row.ownerKeyHash !== ownerKeyHash) return res.status(403).json({ error: 'Forbidden' })
    return res.json({ data: row.project })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Failed to fetch project' })
  }
})

app.post('/api/projects', standardLimiter, requireOwner, (req, res) => {
  const { ownerKeyHash } = req
  const parsed = projectSchema.safeParse(req.body || {})
  if (!parsed.success) {
    // 本番環境では詳細なエラー情報を隠蔽
    const errorMessage = 'Invalid payload'
    return res.status(400).json({
      error: errorMessage,
      ...(!isProduction && { details: parsed.error.flatten() })
    })
  }

  try {
    const data = repository.create({ ownerKeyHash, payload: parsed.data })
    return res.status(201).json({ data })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Failed to create project' })
  }
})

app.put('/api/projects/:id', standardLimiter, requireOwner, (req, res) => {
  const { ownerKeyHash } = req

  // IDのバリデーション
  const idValidation = uuidSchema.safeParse(req.params.id)
  if (!idValidation.success) {
    return res.status(400).json({ error: 'Invalid project ID format' })
  }

  try {
    const existing = repository.getById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.ownerKeyHash !== ownerKeyHash) return res.status(403).json({ error: 'Forbidden' })

    const parsed = projectSchema.safeParse(req.body || {})
    if (!parsed.success) {
      const errorMessage = 'Invalid payload'
      return res.status(400).json({
        error: errorMessage,
        ...(!isProduction && { details: parsed.error.flatten() })
      })
    }

    const data = repository.update({ id: req.params.id, payload: parsed.data })
    if (!data) {
      return res.status(404).json({ error: 'Not found' })
    }
    return res.json({ data })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Failed to update project' })
  }
})

app.delete('/api/projects/:id', standardLimiter, requireOwner, (req, res) => {
  const { ownerKeyHash } = req

  // IDのバリデーション
  const idValidation = uuidSchema.safeParse(req.params.id)
  if (!idValidation.success) {
    return res.status(400).json({ error: 'Invalid project ID format' })
  }

  try {
    const existing = repository.getById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.ownerKeyHash !== ownerKeyHash) return res.status(403).json({ error: 'Forbidden' })

    repository.delete(req.params.id)
    return res.status(204).send()
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Failed to delete project' })
  }
})

// API 404ハンドラー（JSONで返す）
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// SPAフォールバック - API以外のルートはindex.htmlにフォールバック
// パストラバーサル対策：パスを検証
app.get('*', (req, res, next) => {
  // APIリクエストは除外
  if (req.path.startsWith('/api/')) {
    return next()
  }

  const indexPath = path.join(distPath, 'index.html')

  // 診断ログ
  if (NODE_ENV !== 'production' || req.path === '/') {
    console.log(`[Diagnostic] Serving SPA fallback for: ${req.path}`)
  }

  res.sendFile(indexPath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.error(`[Diagnostic] index.html not found at: ${indexPath}`)
      } else {
        console.error(`[Diagnostic] Error sending index.html:`, err)
      }
      next(err)
    }
  })
})

// 最終的な404ハンドラー（コード側かプロキシ側かを判別するため）
app.use((req, res) => {
  console.log(`[Diagnostic] Final 404 Handler hit for: ${req.method} ${req.path}`)
  res.status(404).send('CookWire Code-side 404')
})

// エラーハンドラー
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error('Server Error:', error)

  // 本番環境では詳細なエラー情報を隠蔽
  const response = isProduction
    ? { error: 'Internal server error' }
    : { error: 'Server error', message: error.message }

  return res.status(500).json(response)
})

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`CookWire API listening on port ${PORT}`)
  console.log(`Environment: ${NODE_ENV}`)
  console.log(`CORS origins: ${CORS_ALLOW_ORIGINS}`)
})

// タイムアウト設定（Slowloris攻撃対策）
server.timeout = 30000 // 30秒
server.keepAliveTimeout = 5000 // 5秒
server.headersTimeout = 60000 // 60秒

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
