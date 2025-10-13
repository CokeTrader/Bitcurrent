/**
 * Response Compression Middleware
 * Optimize API response sizes for better performance
 */

const compression = require('compression');
const logger = require('../utils/logger');

/**
 * Smart compression based on content type and size
 */
function smartCompression() {
  return compression({
    // Only compress responses above 1KB
    threshold: 1024,
    
    // Compression level (0-9, 6 is balanced)
    level: 6,
    
    // Filter function to decide what to compress
    filter: (req, res) => {
      // Don't compress if client doesn't support it
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Don't compress streaming responses
      if (res.getHeader('Content-Type')?.includes('stream')) {
        return false;
      }
      
      // Don't compress already compressed content
      const contentType = res.getHeader('Content-Type');
      if (contentType?.includes('gzip') || contentType?.includes('deflate')) {
        return false;
      }
      
      // Use default compression filter
      return compression.filter(req, res);
    },
    
    // Custom flush behavior
    flush: require('zlib').constants.Z_SYNC_FLUSH
  });
}

/**
 * Track compression stats
 */
function compressionStats(req, res, next) {
  const originalWrite = res.write;
  const originalEnd = res.end;
  let originalSize = 0;
  let compressedSize = 0;
  
  res.write = function(chunk, ...args) {
    if (chunk) {
      originalSize += Buffer.byteLength(chunk);
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };
  
  res.end = function(chunk, ...args) {
    if (chunk) {
      originalSize += Buffer.byteLength(chunk);
    }
    
    // Log compression ratio
    const encoding = res.getHeader('Content-Encoding');
    if (encoding && originalSize > 0) {
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      logger.debug('Response compressed', {
        path: req.path,
        originalSize: `${(originalSize / 1024).toFixed(2)}KB`,
        encoding,
        ratio: `${ratio}%`
      });
    }
    
    return originalEnd.apply(res, [chunk, ...args]);
  };
  
  next();
}

module.exports = {
  smartCompression,
  compressionStats
};

