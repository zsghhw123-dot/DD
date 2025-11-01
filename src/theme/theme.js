import { colors, colorUtils } from './colors';
import { typography, typographyUtils } from './typography';

// 间距系统 (基于 4px 网格)
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// 圆角系统
const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999, // 完全圆形
};

// 阴影系统
const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
};

// 组件特定样式
const components = {
  // 按钮样式
  button: {
    primary: {
      backgroundColor: colors.app.buttonPrimary,
      ...typographyUtils.getTextStyle('button', colors.text.inverse),
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 22.5,
    },
    secondary: {
      backgroundColor: colors.app.buttonSecondary,
      ...typographyUtils.getTextStyle('button', colors.text.primary),
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    voice: {
      default: {
        backgroundColor: colors.app.buttonPrimary,
        borderRadius: 35,
        width: 70,
        height: 70,
      },
      pressed: {
        backgroundColor: colors.app.buttonPressed,
      },
      cancel: {
        backgroundColor: colors.app.error,
      },
    },
  },

  // 卡片样式
  card: {
    default: {
      backgroundColor: colors.app.surface,
      borderRadius: 12,
      padding: 16,
      ...shadows.md,
      shadowColor: colors.shadow.light,
    },
    elevated: {
      backgroundColor: colors.app.surface,
      borderRadius: 16,
      padding: 20,
      ...shadows.lg,
      shadowColor: colors.shadow.medium,
    },
  },

  // 输入框样式
  input: {
    default: {
      backgroundColor: colors.app.surface,
      borderRadius: 8,
      padding: 12,
      ...typographyUtils.getTextStyle('body', colors.text.primary),
      borderWidth: 1,
      borderColor: colors.neutral[200],
    },
    focused: {
      borderColor: colors.primary[500],
      ...shadows.sm,
      shadowColor: colors.primary[200],
    },
  },

  // 容器样式
  container: {
    screen: {
      flex: 1,
      backgroundColor: colors.app.background,
      paddingHorizontal: 16,
    },
    section: {
      backgroundColor: colors.app.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
    },
  },
};

// 主题配置
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
};

// 主题工具函数
export const themeUtils = {
  // 获取组件样式
  getComponentStyle: (component, variant = 'default') => {
    return theme.components[component]?.[variant] || {};
  },

  // 创建阴影样式
  createShadow: (elevation, color = colors.shadow.light) => {
    const shadowConfig = theme.shadows[elevation] || theme.shadows.md;
    return {
      ...shadowConfig,
      shadowColor: color,
    };
  },

  // 创建间距样式
  createSpacing: (top, right, bottom, left) => {
    const getSpacing = (value) => {
      return typeof value === 'string' ? theme.spacing[value] : value;
    };

    if (typeof top === 'object') {
      // 如果传入的是对象，直接返回
      return top;
    }

    if (right === undefined) {
      // 只有一个值，应用到所有方向
      const spacing = getSpacing(top);
      return {
        paddingTop: spacing,
        paddingRight: spacing,
        paddingBottom: spacing,
        paddingLeft: spacing,
      };
    }

    if (bottom === undefined) {
      // 两个值：垂直和水平
      const vertical = getSpacing(top);
      const horizontal = getSpacing(right);
      return {
        paddingTop: vertical,
        paddingRight: horizontal,
        paddingBottom: vertical,
        paddingLeft: horizontal,
      };
    }

    if (left === undefined) {
      // 三个值：上、水平、下
      return {
        paddingTop: getSpacing(top),
        paddingRight: getSpacing(right),
        paddingBottom: getSpacing(bottom),
        paddingLeft: getSpacing(right),
      };
    }

    // 四个值：上、右、下、左
    return {
      paddingTop: getSpacing(top),
      paddingRight: getSpacing(right),
      paddingBottom: getSpacing(bottom),
      paddingLeft: getSpacing(left),
    };
  },

  // 创建边距样式
  createMargin: (top, right, bottom, left) => {
    const spacing = themeUtils.createSpacing(top, right, bottom, left);
    return Object.keys(spacing).reduce((acc, key) => {
      acc[key.replace('padding', 'margin')] = spacing[key];
      return acc;
    }, {});
  },

  // 响应式字体大小
  getResponsiveFontSize: (baseSize, scale = 1) => {
    const { Dimensions } = require('react-native');
    const { width } = Dimensions.get('window');
    const baseWidth = 375; // iPhone X 宽度作为基准
    const scaleFactor = (width / baseWidth) * scale;
    return Math.round(baseSize * scaleFactor);
  },
};

// 导出所有相关模块
export { colors, colorUtils } from './colors';
export { typography, typographyUtils } from './typography';
export default theme;