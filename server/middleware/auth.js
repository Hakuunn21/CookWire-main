import { getOwnerKeyFromRequest, hashOwnerKey } from '../security/ownerKey.js'

export function requireOwner(req, res, next) {
  const ownerKeyResult = getOwnerKeyFromRequest(req)
  if (!ownerKeyResult.ok) {
    return res.status(400).json({ error: ownerKeyResult.error })
  }
  req.ownerKeyHash = hashOwnerKey(ownerKeyResult.value)
  next()
}
