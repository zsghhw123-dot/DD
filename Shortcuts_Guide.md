# 苹果快捷指令集成指南

## 配置说明

你的应用现在支持通过深度链接接收来自苹果快捷指令的数据。应用的自定义URL scheme是：`recordapp://`

## 快捷指令设置方法

1. **打开苹果快捷指令App**
2. **创建新的快捷指令**
3. **添加"打开URL"操作**
4. **配置URL格式**：

```
recordapp://create?title=你的标题&description=描述内容&amount=金额&category=分类
```

## URL参数说明

- `title` (必需): 记录标题
- `description` (可选): 记录描述
- `amount` (可选): 金额
- `category` (可选): 分类

## 使用示例

1. **简单记录**:
   ```
   recordapp://create?title=午餐费用
   ```

2. **完整记录**:
   ```
   recordapp://create?title=购物&description=超市购物&amount=128.5&category=生活开销
   ```

## 工作流程

1. 快捷指令发送数据到应用
2. 应用显示确认对话框
3. 用户确认后自动导航到记录创建页面
4. 数据已预填充，用户只需确认保存

## 测试方法

1. 在Safari浏览器中输入完整的URL
2. 点击打开，系统会询问是否在应用中打开
3. 确认后即可测试功能

## 注意事项

- 确保应用已安装并配置了正确的URL scheme
- 参数值需要进行URL编码（快捷指令App会自动处理）
- 金额参数应为数字格式