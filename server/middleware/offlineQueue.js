export function offlineQueueAware(req, _res, next) {
  req.isOfflineBuffered = req.headers["x-offline-buffered"] === "1";
  next();
}
