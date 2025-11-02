import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, theme } from '../../theme';
import RubbishBin from '../../../assets/icons/rubbishBin.svg'

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
    category: record?.title || '健身',
    amount: record?.fields?.金额 ,
    description: record?.description || '今天吃了一碗牛肉面',
    time: formatTimestamp(record?.fields?.日期),
    location: record?.fields?.位置?.[0]?.text 
  });
  
  // 日期时间选择器状态
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(record?.fields?.日期 || new Date()));
  const [tempDate, setTempDate] = useState(new Date(record?.fields?.日期 || new Date()));
  
  console.log('RecordDetail - record:', record);
  console.log('RecordDetail - formData:', formData);
  
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
            <Text style={styles.iconEmoji}>{formData.icon}</Text>
          </View>
          <TouchableOpacity style={styles.categoryButton}>
            <Text style={styles.categoryText}>{formData.category}</Text>
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
                value={formData.location}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholder="添加位置"
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