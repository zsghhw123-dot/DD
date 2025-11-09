// 应用字体系统定义
export const typography = {
  // 字体族
  fontFamily: {
    // iOS 和 Android 的系统字体
    system: {
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System', // React Native 默认系统字体
    },
    // 中文字体
    chinese: {
      ios: 'PingFang SC',
      android: 'Noto Sans CJK SC',
      default: 'System',
    },
    // 等宽字体
    monospace: {
      ios: 'SF Mono',
      android: 'Roboto Mono',
      default: 'monospace',
    },
  },

  // 字体大小 (基于现有使用的尺寸)
  fontSize: {
    xs: 8,    // 极小 (日历小标记)
    sm: 13,   // 小 (次要信息)
    base: 14, // 基础 (提示文本)
    md: 16,   // 中等 (正文、按钮)
    lg: 18,   // 大 (标题、重要文本)
    xl: 24,   // 特大 (页面标题)
    xxl: 28,  // 超大 (主要数字显示)
  },

  // 字体粗细
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },

  // 行高 (相对于字体大小的倍数)
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // 字母间距
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },

  // 预定义的文本样式
  textStyles: {
    // 标题样式
    h1: {
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
    },
    h4: {
      fontSize: 16,
      fontWeight: '600'
    },

    // 正文样式
    body: {
      fontSize: 16,
      fontWeight: '400'
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500'
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
    },
    // 标签和说明文字
    caption: {
      fontSize: 13,
      fontWeight: '400',
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
    },

    // 按钮文字
    button: {
      fontSize: 16,
      fontWeight: '600',
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '500',
    },

    // 特殊样式
    overline: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    
    // 数字显示
    display: {
      fontSize: 28,
      fontWeight: '300',
    },
  },
};

// 字体工具函数
export const typographyUtils = {
  // 获取平台特定的字体族
  getPlatformFontFamily: (type = 'system') => {
    const Platform = require('react-native').Platform;
    const fontFamilies = typography.fontFamily[type];
    
    if (Platform.OS === 'ios') {
      return fontFamilies.ios;
    } else if (Platform.OS === 'android') {
      return fontFamilies.android;
    }
    return fontFamilies.default;
  },

  // 创建文本样式
  createTextStyle: (size, weight = 'normal', color = '#333333') => ({
    fontSize: typeof size === 'string' ? typography.fontSize[size] : size,
    fontWeight: typeof weight === 'string' ? typography.fontWeight[weight] : weight,
    color: color,
    fontFamily: typographyUtils.getPlatformFontFamily(),
  }),

  // 获取预定义样式
  getTextStyle: (styleName, customColor) => {
    const baseStyle = typography.textStyles[styleName];
    if (!baseStyle) return {};
    
    return {
      ...baseStyle,
      fontFamily: typographyUtils.getPlatformFontFamily(),
      ...(customColor && { color: customColor }),
    };
  },

  // 计算行高像素值
  getLineHeightPixels: (fontSize, lineHeightMultiplier) => {
    return Math.round(fontSize * lineHeightMultiplier);
  },
};

export default typography;