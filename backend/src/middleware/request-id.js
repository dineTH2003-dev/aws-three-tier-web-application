import crypto from 'node:crypto';

export function requestIdMiddleware(req, res, next) {
  const existingId = req.headers['x-request-id'];
  const requestId = existingId || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
