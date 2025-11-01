// 提取表情符号的函数
export const extractEmojis = (text) => {
  const emojiRegex = /[\u203C-\u2049\u20E3\u2191-\u21FF\u2302-\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2-\u25EC\u2600-\u27BF\u2C60-\u2C7F\u2D30-\u2D7F\uA960-\uAEBFL\uD83C-\uDBFF\uDC00-\uDFFF]+/g;
  return text.match(emojiRegex) || [];
};

// 移除表情符号
export const removeEmojis = (text) => {
  const emojiRegex = /[\u203C-\u2049\u20E3\u2191-\u21FF\u2302-\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2-\u25EC\u2600-\u27BF\u2C60-\u2C7F\u2D30-\u2D7F\uA960-\uAEBFL\uD83C-\uDBFF\uDC00-\uDFFF]+/g;
  return text.replace(emojiRegex, '').trim();
};

// 截断文本
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 格式化金额
export const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '';
  return `¥${amount.toFixed(2)}`;
};

// 验证文本是否为空
export const isEmpty = (text) => {
  return !text || text.trim().length === 0;
};