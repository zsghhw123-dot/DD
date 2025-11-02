import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { colors, theme } from '../../theme';
import RubbishBin from '../../../assets/icons/rubbishBin.svg'
import CategorySelector from '../CategorySelector';
import { getCategoryById, getDefaultCategory , getCategoryByName} from '../../data/categories';

const RecordDetail = ({ route, navigation }) => {
  const { record } = route?.params || {};
  const isNewRecord = !record;
  
  // 格式化时间戳为年月日小时分钟格式
  const formatTimestamp = (timestamp) => {
    let date;
    
    if (!timestamp) {
      date = new Date();
    } else {
      date = new Date(timestamp);
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  // 状态管理
  const [formData, setFormData] = useState({
    icon: record?.icon,
    category: record?.title || "请选择分类",
    amount: record?.fields?.金额 ,
    description: record?.description,
    time: formatTimestamp(record?.fields?.日期),
    location: record?.fields?.位置?.[0]?.text 
  });
  
  // 日期时间选择器状态
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(record?.fields?.日期 || new Date()));
  const [tempDate, setTempDate] = useState(new Date(record?.fields?.日期 || new Date()));
  
  // 位置获取状态
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // 分类选择状态
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    // 如果是编辑现有记录，尝试根据记录的title找到对应分类
    if (record?.title) {
      const category = getCategoryByName(record.title)
      return category
    }
    // 新记录使用默认分类
    return undefined
  });
  
  console.log('RecordDetail - record:', record);
  console.log('RecordDetail - formData:', formData);
  
  // 获取当前位置信息
  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('位置权限被拒绝');
        setFormData(prev => ({
          ...prev,
          location: '位置权限被拒绝'
        }));
        setIsLoadingLocation(false);
        return;
      }

      // 获取当前位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000, // 10秒超时
      });

      // 反向地理编码获取地址信息
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        // 构建地址字符串，优先显示更具体的位置信息
        const locationParts = [
          address.city || address.region,
          address.district || address.subregion,
          address.street,
          address.name
        ].filter(Boolean);
        
        const locationText = locationParts.length > 0 
          ? locationParts.join('') 
          : `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
        
        // 更新位置信息
        setFormData(prev => ({
          ...prev,
          location: locationText
        }));
      } else {
        // 如果反向地理编码失败，显示坐标
        setFormData(prev => ({
          ...prev,
          location: `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
        }));
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      let errorMessage = '获取位置失败';
      
      if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = '位置获取超时';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = '位置服务不可用';
      }
      
      setFormData(prev => ({
        ...prev,
        location: errorMessage
      }));
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // 组件初始化时获取位置（仅新记录）
  useEffect(() => {
    if (isNewRecord) {
      getCurrentLocation();
    }
  }, [isNewRecord]);

  // 分类选择处理函数
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setFormData(prev => ({
      ...prev,
      category: category.name,
      icon: category.icon
    }));
  };

  const openCategorySelector = () => {
    setShowCategorySelector(true);
  };
  
  // 处理日期时间选择
  const handleDateChange = (event, date) => {
    if (date) {
      setTempDate(date);
    }
  };
  
  // 确认日期选择
  const confirmDateSelection = () => {
    setSelectedDate(tempDate);
    const formattedTime = formatTimestamp(tempDate);
    setFormData({...formData, time: formattedTime});
    setShowDatePicker(false);
  };
  
  // 取消日期选择
  const cancelDateSelection = () => {
    setTempDate(selectedDate); // 恢复到之前的日期
    setShowDatePicker(false);
  };
  
  // 显示日期选择器
  const showDateTimePicker = () => {
    setTempDate(selectedDate); // 设置临时日期为当前选择的日期
    setShowDatePicker(true);
  };
  
  const handleSave = () => {
    console.log('保存记录:', formData);
    // 这里可以添加保存逻辑
    navigation.goBack();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDelete = () => {
    console.log('删除记录');
    // 这里可以添加删除逻辑
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>记录详情</Text>
        {!isNewRecord && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <RubbishBin style={styles.deleteIcon} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 图标区域 */}
        <View style={styles.iconSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>{selectedCategory?.icon}</Text>
          </View>
          <TouchableOpacity style={styles.categoryButton} onPress={openCategorySelector}>
            <Text style={styles.categoryText}>{selectedCategory?.name || "请选择分类"}</Text>
            <Text style={styles.categoryArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 表单字段 */}
        <View style={styles.formSection}>
          {/* 金额 */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <Text style={styles.fieldIconText}>💰</Text>
            </View>
            <Text style={styles.fieldLabel}>金额</Text>
            <View style={styles.fieldValueContainer}>
              <TextInput
                style={[styles.fieldValue, styles.amountInput]}
                value={String(formData.amount || '')}
                onChangeText={(text) => {
                  // 允许输入数字、小数点和空字符串
                  if (text === '' || /^\d*\.?\d*$/.test(text)) {
                    setFormData({...formData, amount: text});
                  }
                }}
                keyboardType="numeric"
                placeholder="输入金额"
              />
              <Text style={styles.fieldArrow}>›</Text>
            </View>
          </View>

          {/* 备注 */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <Text style={styles.fieldIconText}>📝</Text>
            </View>
            <Text style={styles.fieldLabel}>备注</Text>
            <View style={styles.fieldValueContainer}>
              <TextInput
                style={styles.fieldValue}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="添加备注"
              />
              <Text style={styles.fieldArrow}>›</Text>
            </View>
          </View>

          {/* 时间 */}
          <TouchableOpacity style={styles.fieldRow} onPress={showDateTimePicker}>
            <View style={styles.fieldIcon}>
              <Text style={styles.fieldIconText}>⏰</Text>
            </View>
            <Text style={styles.fieldLabel}>时间</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={styles.fieldValue}>
                {formData.time}
              </Text>
              <Text style={styles.fieldArrow}>›</Text>
            </View>
          </TouchableOpacity>

          {/* 位置 */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <Text style={styles.fieldIconText}>📍</Text>
            </View>
            <Text style={styles.fieldLabel}>位置</Text>
            <View style={styles.fieldValueContainer}>
              <TextInput
                style={styles.fieldValue}
                value={isLoadingLocation ? '正在获取位置...' : formData.location}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholder="添加位置"
                editable={!isLoadingLocation}
              />
              <Text style={styles.fieldArrow}>›</Text>
            </View>
          </View>
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* 日期时间选择器模态框 */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDateSelection}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>选择日期和时间</Text>
            </View>
            
            <View style={styles.datePickerContent}>
              {Platform.OS === 'web' ? (
                <input
                  type="datetime-local"
                  value={tempDate.toISOString().slice(0, 16)}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setTempDate(newDate);
                  }}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 16,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: 8,
                    backgroundColor: colors.app.surface,
                    color: colors.app.textPrimary,
                  }}
                />
              ) : (
                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={tempDate}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    locale="zh-CN"
                    style={styles.datePicker}
                    textColor={colors.app.textPrimary}
                    accentColor={colors.primary[500]}
                    themeVariant="light"
                  />
                </View>
              )}
            </View>
            
            <View style={styles.datePickerButtons}>
              <TouchableOpacity 
                style={[styles.datePickerButton, styles.cancelButton]} 
                onPress={cancelDateSelection}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.datePickerButton, styles.confirmButton]} 
                onPress={confirmDateSelection}
              >
                <Text style={styles.confirmButtonText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 分类选择器 */}
      <CategorySelector
        visible={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.app.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: colors.app.background,
    marginTop: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.app.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.app.textPrimary,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  iconSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.app.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  iconEmoji: {
    fontSize: 32,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  categoryText: {
    fontSize: 16,
    color: colors.app.textPrimary,
    marginRight: theme.spacing.xs,
  },
  categoryArrow: {
    fontSize: 18,
    color: colors.neutral[400],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderStyle: 'dashed',
  },
  formSection: {
    backgroundColor: colors.app.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  fieldIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  fieldIconText: {
    fontSize: 18,
  },
  fieldLabel: {
    fontSize: 16,
    color: colors.app.textPrimary,
    minWidth: 60,
  },
  fieldValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: theme.spacing.md,
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    color: colors.app.textSecondary,
    textAlign: 'right',
    paddingVertical: 0,
  },
  amountInput: {
    color: colors.app.error,
    fontWeight: '600',
  },
  fieldArrow: {
    fontSize: 18,
    color: colors.neutral[400],
    marginLeft: theme.spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.app.buttonPrimary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
    elevation: 8,
    shadowColor: colors.app.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  // 日期选择器模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: colors.app.surface,
    borderRadius: theme.borderRadius.xl,
    margin: theme.spacing.xl,
    maxWidth: 350,
    width: '90%',
    ...theme.shadows.lg,
    elevation: 10,
  },
  datePickerHeader: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.app.textPrimary,
  },
  datePickerContent: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 250, // 增加高度以确保iOS选择器完全显示
  },
  datePickerWrapper: {
    width: '100%',
    height: 220, // 增加高度以适应iOS spinner
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.app.surface, // 添加背景色
  },
  datePicker: {
    width: '100%',
    height: 220, // 与wrapper保持一致
    backgroundColor: 'transparent',
  },
  datePickerButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: colors.neutral[200],
  },
  confirmButton: {
    backgroundColor: colors.app.buttonPrimary,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.app.textSecondary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.app.textPrimary,
  },
});

export default RecordDetail;