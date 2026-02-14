/* global process */
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import { z } from 'zod'
import { createProjectsRepository } from './storage/projectsRepository.js'
import { streamText } from 'ai'
import { requireOwner } from './middleware/auth.js'
import { myMockModel } from './services/mockAi.js'

const PORT = process.env.PORT || 3001
const CORS_ALLOW_ORIGINS = process.env.CORS_ALLOW_ORIGINS || 'http://localhost:5173,http://localhost:5177'
const DATA_DIR = process.env.DATA_DIR
const DATABASE_PATH = process.env.DATABASE_PATH

const app = express()
const repository = createProjectsRepository({ dataDir: DATA_DIR, databasePath: DATABASE_PATH })

const allowedOrigins = CORS_ALLOW_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
const corsOrigin = allowedOrigins.includes('*') ? '*' : allowedOrigins

app.use(cors({ origin: corsOrigin }))
app.use(express.json({ limit: '2mb' }))
app.use(morgan('combined'))

app.post('/api/chat', requireOwner, async (req, res) => {
  try {
    const { messages } = req.body
    const result = await streamText({
      model: myMockModel,
      messages,
    })
    result.pipeDataStreamToResponse(res)
  } catch (error) {
    console.error('AI Error:', error)
    res.status(500).json({ error: 'Failed to process chat' })
  }
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
})

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

app.get('/health', (req, res) => {
  return res.json({ ok: true, version: '2.0.0' })
})

app.get('/api/projects', apiLimiter, requireOwner, (req, res) => {
  const { ownerKeyHash } = req
  const rawLimit = Number.parseInt(req.query.limit, 10)
  const rawOffset = Number.parseInt(req.query.offset, 10)
  const limit = Number.isNaN(rawLimit) ? 50 : Math.max(1, Math.min(rawLimit, 200))
  const offset = Number.isNaN(rawOffset) ? 0 : Math.max(0, rawOffset)

  const data = repository.listByOwner(ownerKeyHash, { limit, offset })
  return res.json({ data })
})

app.get('/api/projects/:id', apiLimiter, requireOwner, (req, res) => {
  const { ownerKeyHash } = req
  const row = repository.getById(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  if (row.ownerKeyHash !== ownerKeyHash) return res.status(403).json({ error: 'Forbidden' })
  return res.json({ data: row.project })
})

app.post('/api/projects', apiLimiter, requireOwner, (req, res) => {
  const { ownerKeyHash } = req
  const parsed = projectSchema.safeParse(req.body || {})
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const data = repository.create({ ownerKeyHash, payload: parsed.data })
  return res.status(201).json({ data })
})

app.put('/api/projects/:id', apiLimiter, requireOwner, (req, res) => {
  const { ownerKeyHash } = req
  const existing = repository.getById(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.ownerKeyHash !== ownerKeyHash) return res.status(403).json({ error: 'Forbidden' })

  const parsed = projectSchema.safeParse(req.body || {})
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const data = repository.update({ id: req.params.id, payload: parsed.data })
  return res.json({ data })
})

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error(error)
  return res.status(500).json({ error: 'Server error' })
})

app.listen(PORT, () => {
  console.log(`CookWire API listening on port ${PORT}`)
})
