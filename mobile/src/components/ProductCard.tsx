import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  productName: string;
  sales: number;
  subtitle: string;
  highlight?: boolean;
}

export const ProductCard: React.FC<Props> = ({ productName, sales, subtitle, highlight = false }) => (
  <View style={[styles.card, highlight && styles.cardHighlight]}>
    <Text style={styles.subtitle}>{subtitle}</Text>
    <Text style={styles.productName} numberOfLines={3}>{productName}</Text>
    <View style={styles.salesRow}>
      <Text style={styles.salesNumber}>{sales}</Text>
      <Text style={styles.salesLabel}>{sales === 1 ? 'sale' : 'sales'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0F8438',
  },
  cardHighlight: {
    backgroundColor: '#FFF8E5',
    borderLeftColor: '#E25822',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 22,
  },
  salesRow: { flexDirection: 'row', alignItems: 'baseline' },
  salesNumber: { fontSize: 28, fontWeight: '700', color: '#0F8438' },
  salesLabel: { fontSize: 14, color: '#666', marginLeft: 6 },
});
