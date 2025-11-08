import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

const RecordItem = ({ icon, title, description, amount, onPress, fields = {} }) => {
  const hasPhotos = fields.照片 && fields.照片.length > 0;
  
  const content = (
    <View style={[
      styles.container, 
      hasPhotos && styles.containerInGradient,
      !hasPhotos && { marginBottom: 10 }
    ]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{amount}¥</Text>
      </View>
    </View>
  );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {hasPhotos ? (
        <LinearGradient
          colors={['#00D4FF', '#00FF88']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBorder}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 18,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#888',
  },
  amountContainer: {
    paddingLeft: 10,
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
  },
  gradientBorder: {
    borderRadius: 15,
    padding: 2,
    marginBottom: 10,
  },
  containerInGradient: {
    margin: 0,
    borderRadius: 13,
  },
  withPhotos: {
    // 保留此样式以防其他地方使用，但渐变边框通过 LinearGradient 实现
  },
});

export default RecordItem;