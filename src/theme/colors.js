// 应用颜色系统定义
export const colors = {
  // 主色调 - 绿色系
  primary: {
    50: '#f0f9f4',   // 最浅绿色
    100: '#dcfce7',  // 很浅绿色
    200: '#bbf7d0',  // 浅绿色
    300: '#86efac',  // 中浅绿色
    400: '#4ade80',  // 中绿色
    500: '#22c55e',  // 标准绿色
    600: '#16a34a',  // 深绿色
    700: '#15803d',  // 很深绿色
    800: '#166534',  // 最深绿色
    900: '#14532d',  // 极深绿色
    1000: '#8DB9A1'
  },

  // 应用特定绿色 (基于现有颜色)
  app: {
    background: '#f5fcf9',      // 主背景色
    backgroundAlt: '#EEF7F2',   // 替代背景色
    surface: '#ffffff',         // 表面色
    surfaceAlt: '#e8f5f0',     // 替代表面色
    
    // 按钮颜色
    buttonPrimary: '#B8E2CB',   // 主按钮 (语音按钮默认)
    buttonPressed: '#8DB9A1',   // 按钮按下状态
    buttonSecondary: '#D9EFE2', // 次要按钮 (添加按钮)
    buttonTertiary: '#9ABDA9',  // 第三按钮 (键盘按钮)
    
    // 状态颜色
    success: '#4CAF50',         // 成功色
    warning: '#ffcc5c',         // 警告色
    error: '#ff4444',           // 错误色 (取消模式)
    info: '#a8e6cf',           // 信息色
  },

  // 中性色
  neutral: {
    0: '#ffffff',    // 纯白
    50: '#f9fafb',   // 极浅灰
    100: '#f3f4f6',  // 很浅灰
    200: '#e5e7eb',  // 浅灰
    300: '#d1d5db',  // 中浅灰
    400: '#9ca3af',  // 中灰
    500: '#6b7280',  // 标准灰
    600: '#4b5563',  // 深灰
    700: '#374151',  // 很深灰
    800: '#1f2937',  // 最深灰
    900: '#111827',  // 极深灰
    1000: '#000000', // 纯黑
  },

  // 文本颜色
  text: {
    primary: '#333333',         // 主要文本
    secondary: '#666666',       // 次要文本
    tertiary: '#888888',        // 第三文本
    disabled: '#cccccc',        // 禁用文本
    inverse: '#ffffff',         // 反色文本
    link: '#4CAF50',           // 链接文本
  },

  // 阴影和边框
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // 透明度变体
  opacity: {
    background: 'rgba(245, 252, 249, 0.8)',  // 半透明背景
    overlay: 'rgba(0, 0, 0, 0.5)',           // 遮罩层
  },
};

// 颜色工具函数
export const colorUtils = {
  // 获取颜色的透明度变体
  withOpacity: (color, opacity) => {
    // 如果是 hex 颜色，转换为 rgba
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // 如果已经是 rgba，替换透明度
    if (color.startsWith('rgba')) {
      return color.replace(/[\d\.]+\)$/g, `${opacity})`);
    }
    return color;
  },

  // 获取主题色调
  getThemeColors: () => ({
    primary: colors.app.buttonPrimary,
    secondary: colors.app.buttonSecondary,
    background: colors.app.background,
    surface: colors.app.surface,
    text: colors.text.primary,
  }),
};

export default colors;