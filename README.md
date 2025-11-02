1.如果没有ios目录则需要先运行`npx expo prebuild --ios`
然后安装ios依赖
前往ios目录
2.运行`pod install`

3.运行
xcodebuild -workspace recordapp.xcworkspace -scheme recordapp -sdk iphoneos -configuration Release -derivedDataPath build CODE_SIGNING_ALLOWED=NO

4.

#!/bin/bash
echo "🎯 Expo 项目 IPA 打包流程..."

# 检查是否在 Expo 项目根目录
if [ ! -f "app.json" ] && [ ! -f "app.config.js" ]; then
    echo "❌ 错误：请在 Expo 项目根目录运行"
    exit 1
fi

echo "1. 安装/修复 Expo 依赖..."
npx expo install --fix

echo "2. 清理并重新生成 iOS 项目..."
npx expo prebuild --clean --platform ios

echo "3. 进入 iOS 目录..."
cd ios

echo "4. 安装 CocoaPods 依赖..."
pod install --repo-update

echo "5. 构建应用..."
xcodebuild -workspace recordapp.xcworkspace \
  -scheme recordapp \
  -sdk iphoneos \
  -configuration Release \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    
    echo "6. 创建 IPA 文件..."
    mkdir -p Payload
    cp -r build/Build/Products/Release-iphoneos/recordapp.app Payload/
    zip -qr recordapp-unsigned.ipa Payload
    rm -rf Payload
    echo "🎉 IPA 创建完成: recordapp-unsigned.ipa"
    ls -la *.ipa
else
    echo "❌ 构建失败，尝试使用 Expo CLI 构建..."
    cd ..
    npx expo run:ios --configuration Release
fi

cd ..