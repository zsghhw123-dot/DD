// 生成月份键的函数
export const getMonthKey = (year, month) => {
  return `${year}-${month.toString().padStart(2, '0')}`;
};

// 计算前后n个月的年月列表
export const getMonthRange = (centerYear, centerMonth, n = 3) => {
  const months = [];
  
  for (let i = -n; i <= n; i++) {
    const date = new Date(centerYear, centerMonth - 1 + i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1
    });
  }
  
  return months;
};

// 格式化日期显示
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取当前日期
export const getCurrentDate = () => {
  return new Date();
};

// 检查是否为今天
export const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};