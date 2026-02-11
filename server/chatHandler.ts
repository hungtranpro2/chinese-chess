// Rate limit cho chat
const rateLimits = new Map<string, number[]>();

const MAX_MESSAGES = 5;
const TIME_WINDOW = 10000; // 10 giây

// Validate và rate-limit tin nhắn chat
export function validateChatMessage(socketId: string, text: string): { valid: boolean; sanitizedText?: string; error?: string } {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { valid: false, error: 'Tin nhắn trống' };
  }

  if (text.length > 200) {
    return { valid: false, error: 'Tin nhắn quá dài (tối đa 200 ký tự)' };
  }

  // Rate limit
  const now = Date.now();
  const timestamps = rateLimits.get(socketId) || [];
  const recent = timestamps.filter(t => now - t < TIME_WINDOW);

  if (recent.length >= MAX_MESSAGES) {
    return { valid: false, error: 'Gửi tin nhắn quá nhanh, vui lòng chờ' };
  }

  recent.push(now);
  rateLimits.set(socketId, recent);

  // HTML sanitize
  const sanitizedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();

  return { valid: true, sanitizedText };
}

// Cleanup rate limit khi disconnect
export function clearRateLimit(socketId: string): void {
  rateLimits.delete(socketId);
}
