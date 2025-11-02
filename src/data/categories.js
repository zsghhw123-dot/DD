// 记录分类数据
export const categories = [
  {
    id: 'social',
    icon: '🍻',
    name: '社交',
    description: '聚会、聚餐、社交活动'
  },
  {
    id: 'haircut',
    icon: '💇‍♂️',
    name: '理发',
    description: '理发、美发、造型'
  },
  {
    id: 'travel',
    icon: '🏝',
    name: '旅游',
    description: '旅行、度假、观光'
  },
  {
    id: 'transport',
    icon: '🚇',
    name: '交通',
    description: '地铁、公交、打车、加油'
  },
  {
    id: 'other',
    icon: '❤️',
    name: '其它',
    description: '其他未分类支出'
  },
  {
    id: 'date',
    icon: '💃',
    name: '约会',
    description: '约会、恋爱相关支出'
  },
  {
    id: 'clothing',
    icon: '🕺',
    name: '衣物',
    description: '服装、鞋子、配饰'
  },
  {
    id: 'membership',
    icon: '🤖',
    name: '会员服务',
    description: '各种会员、订阅服务'
  },
  {
    id: 'drinks',
    icon: '🥤',
    name: '饮料',
    description: '饮料、咖啡、奶茶'
  },
  {
    id: 'fruits',
    icon: '🍉',
    name: '水果',
    description: '水果、果汁'
  },
  {
    id: 'fitness',
    icon: '💪',
    name: '健身',
    description: '健身房、运动器材、运动服装'
  },
  {
    id: 'daily_goods',
    icon: '🪞',
    name: '生活用品',
    description: '日用品、家居用品'
  },
  {
    id: 'electronics',
    icon: '📱',
    name: '电子产品',
    description: '手机、电脑、数码产品'
  },
  {
    id: 'chongchong',
    icon: '🥛',
    name: '冲冲',
    description: '冲冲相关支出'
  },
  {
    id: 'football',
    icon: '⚽️',
    name: '足球',
    description: '足球相关支出'
  },
  {
    id: 'gifts',
    icon: '💝',
    name: '赠礼',
    description: '礼品、礼物'
  },
  {
    id: 'snacks',
    icon: '🍭',
    name: '零食',
    description: '零食、小食'
  },
  {
    id: 'study',
    icon: '📚',
    name: '学习',
    description: '书籍、课程、教育'
  },
  {
    id: 'online_shopping',
    icon: '🛍️',
    name: '网购（小物件）',
    description: '网上购买的小物件'
  },
  {
    id: 'medical',
    icon: '😷',
    name: '生病',
    description: '医疗、药品、看病'
  },
  {
    id: 'food',
    icon: '🍚',
    name: '餐饮',
    description: '用餐、外卖、食物'
  },
  {
    id: 'family',
    icon: '🏡',
    name: '给家人花费',
    description: '为家人支出的费用'
  }
];

// 根据ID获取分类信息
export const getCategoryById = (id) => {
  return categories.find(category => category.id === id);
};

// 根据名称获取分类信息
export const getCategoryByName = (name) => {
  return categories.find(category => category.name === name);
};

// 获取默认分类
export const getDefaultCategory = () => {
  return categories.find(category => category.id === 'other') || categories[0];
};