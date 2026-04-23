const memory = new Map();

export function basicRateLimit(limit = 120, windowMs = 60_000) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = memory.get(key) || { count: 0, start: now };

    if (now - entry.start > windowMs) {
      entry.count = 0;
      entry.start = now;
    }

    entry.count += 1;
    memory.set(key, entry);

    if (entry.count > limit) {
      return res.status(429).json({ message: "Too many requests" });
    }

    return next();
  };
}
