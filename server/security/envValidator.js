/**
 * 環境変数のバリデーションと検証
 */

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
    // 本番環境ではワイルドカードを警告
    validate: (value, env) => {
      if (env.NODE_ENV === 'production' && value === '*') {
        return { ok: false, warning: 'Wildcard CORS is not recommended in production' }
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
    default: null, // DATA_DIRから自動生成
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
    // 本番環境でのみtrueにすべき警告
    validate: (value, env) => {
      if (value === true && env.NODE_ENV !== 'production') {
        return { ok: false, warning: 'TRUST_PROXY should be false in non-production environments' }
      }
      return { ok: true }
    },
  },
}

function parseValue(value, type) {
  switch (type) {
    case 'number':
      const num = Number(value)
      return Number.isNaN(num) ? null : num
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
    let value = rawValue !== undefined ? parseValue(rawValue, config.type) : config.default

    // バリデーション
    if (value !== null && config.min !== undefined && value < config.min) {
      errors.push(`${key} must be >= ${config.min}`)
      continue
    }
    if (value !== null && config.max !== undefined && value > config.max) {
      errors.push(`${key} must be <= ${config.max}`)
      continue
    }
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

  // 結果の出力
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:')
    warnings.forEach(w => console.warn(`  - ${w}`))
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment Errors:')
    errors.forEach(e => console.error(`  - ${e}`))
    process.exit(1)
  }

  return validated
}
