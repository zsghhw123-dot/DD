import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { colors, theme } from '../../theme';
import { categories } from '../../data/categories';

const CategorySelector = ({ visible, onClose, onSelect, selectedCategory }) => {
  const handleCategorySelect = (category) => {
    onSelect(category);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* 标题栏 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>选择分类</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 分类列表 */}
          <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory?.id === category.id && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <View style={[
                    styles.categoryIconContainer,
                    selectedCategory?.id === category.id && styles.selectedIconContainer
                  ]}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                  </View>
                  <Text style={[
                    styles.categoryName,
                    selectedCategory?.id === category.id && styles.selectedCategoryName
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.app.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '70%',
    minHeight: 400,
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  cancelButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.app.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.app.textPrimary,
  },
  placeholder: {
    width: 60, // 与取消按钮宽度保持平衡
  },
  categoryList: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: theme.spacing.lg,
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  selectedCategoryItem: {
    backgroundColor: colors.primary[50],
    borderRadius: theme.borderRadius.md,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  selectedIconContainer: {
    backgroundColor: colors.primary[100],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 12,
    color: colors.app.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedCategoryName: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});

export default CategorySelector;