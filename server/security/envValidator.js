/**
 * 環境変数のバリデーションと検証
 */

/* global process */

const ENV_SCHEMA = {
  PORT: {
    type: 'number',
    min: 1,
    max: 65535,
    default: 3000,
  },
  NODE_ENV: {
    type: 'enum',
    values: ['development', 'production', 'test'],
    default: 'development',
  },
  CORS_ALLOW_ORIGINS: {
    type: 'string',
    default: 'http://localhost:5173,http://localhost:5177',
    // 本番環境ではワイルドカードを拒否
    validate: (value, env) => {
      if (env.NODE_ENV === 'production' && value === '*') {
        return {
          ok: false,
          error:
            'Wildcard CORS (*) is not allowed in production. ' +
            'Set CORS_ALLOW_ORIGINS to specific origins.',
        }
      }
      return { ok: true }
    },
  },
  DATA_DIR: {
    type: 'string',
    default: './data',
    validate: (value) => {
      // パストラバーサルチェック
      if (value.includes('..')) {
        return { ok: false, error: 'DATA_DIR must not contain ".."' }
      }
      return { ok: true }
    },
  },
  DATABASE_PATH: {
    type: 'string',
    // 空文字列 = DATA_DIR から自動生成（index.js 側で処理）
    default: '',
    validate: (value) => {
      if (value && value.includes('..')) {
        return { ok: false, error: 'DATABASE_PATH must not contain ".."' }
      }
      return { ok: true }
    },
  },
  TRUST_PROXY: {
    type: 'boolean',
    default: false,
    validate: (value, env) => {
      if (value === true && env.NODE_ENV !== 'production') {
        return {
          ok: false,
          warning: 'TRUST_PROXY should be false in non-production environments',
        }
      }
      return { ok: true }
    },
  },
  // CSRF署名用シークレット（本番環境では32文字以上必須）
  CSRF_SECRET: {
    type: 'string',
    default: '',
    validate: (value, env) => {
      if (env.NODE_ENV === 'production' && (!value || value.length < 32)) {
        return {
          ok: false,
          error:
            'CSRF_SECRET must be set to at least 32 characters in production',
        }
      }
      if (value && value.length > 0 && value.length < 32) {
        return {
          ok: false,
          warning:
            'CSRF_SECRET is shorter than 32 characters; a random per-process secret will be used instead',
        }
      }
      return { ok: true }
    },
  },
  // Owner Keyハッシュ用シークレット（本番環境では32文字以上必須）
  OWNER_KEY_SECRET: {
    type: 'string',
    default: '',
    validate: (value, env) => {
      if (env.NODE_ENV === 'production' && (!value || value.length < 32)) {
        return {
          ok: false,
          error:
            'OWNER_KEY_SECRET must be set to at least 32 characters in production',
        }
      }
      if (value && value.length > 0 && value.length < 32) {
        return {
          ok: false,
          warning:
            'OWNER_KEY_SECRET is shorter than 32 characters; a random per-process secret will be used instead',
        }
      }
      return { ok: true }
    },
  },
}

function parseValue(value, type) {
  switch (type) {
    case 'number': {
      const num = Number(value)
      return Number.isNaN(num) ? null : num
    }
    case 'boolean':
      return value === 'true' || value === '1'
    case 'string':
      return value || ''
    default:
      return value
  }
}

export function validateEnv() {
  const warnings = []
  const errors = []
  const validated = {}

  for (const [key, config] of Object.entries(ENV_SCHEMA)) {
    const rawValue = process.env[key]
    const value =
      rawValue !== undefined ? parseValue(rawValue, config.type) : config.default

    // 数値範囲チェック
    if (value !== null && config.min !== undefined && value < config.min) {
      errors.push(`${key} must be >= ${config.min}`)
      continue
    }
    if (value !== null && config.max !== undefined && value > config.max) {
      errors.push(`${key} must be <= ${config.max}`)
      continue
    }
    // 列挙型チェック
    if (config.type === 'enum' && !config.values.includes(value)) {
      errors.push(`${key} must be one of: ${config.values.join(', ')}`)
      continue
    }

    // カスタムバリデーション
    if (config.validate) {
      const result = config.validate(value, validated)
      if (!result.ok) {
        if (result.error) {
          errors.push(result.error)
          continue
        }
        if (result.warning) {
          warnings.push(result.warning)
        }
      }
    }

    validated[key] = value
  }

  // DATABASE_PATH が空の場合は null を設定（index.js 側で DATA_DIR から生成）
  if (!validated.DATABASE_PATH) {
    validated.DATABASE_PATH = null
  }

  // 結果の出力
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:')
    warnings.forEach((w) => console.warn(`  - ${w}`))
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment Errors:')
    errors.forEach((e) => console.error(`  - ${e}`))
    process.exit(1)
  }

  return validated
}
