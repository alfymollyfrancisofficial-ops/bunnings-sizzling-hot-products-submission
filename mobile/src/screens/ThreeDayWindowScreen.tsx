import React from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet, RefreshControl,
} from 'react-native';
import { gql, useQuery } from '@apollo/client';
import { ProductCard } from '../components/ProductCard';

const PERIOD_QUERY = gql`
  query TopProductForPeriod {
    topProductForPeriod(endDate: "23/04/2026", days: 3) {
      startDate
      endDate
      product { productId productName sales }
    }
  }
`;

interface Data {
  topProductForPeriod: {
    startDate: string;
    endDate: string;
    product: { productId: string; productName: string; sales: number } | null;
  };
}

export const ThreeDayWindowScreen: React.FC = () => {
  const { data, loading, error, refetch } = useQuery<Data>(PERIOD_QUERY);

  if (loading && !data) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#0F8438" /></View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't reach the API</Text>
        <Text style={styles.errorBody}>{error.message}</Text>
      </View>
    );
  }

  const result = data!.topProductForPeriod;
  const subtitle = `${result.startDate} – ${result.endDate}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Top over the last 3 days</Text>
      <Text style={styles.intro}>The single best-selling product across the rolling 3-day window.</Text>
      {result.product ? (
        <ProductCard
          highlight
          subtitle={subtitle}
          productName={result.product.productName}
          sales={result.product.sales}
        />
      ) : (
        <View style={styles.emptyDay}>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.emptyDayText}>No sales in this window</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F5F5F5' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  intro: { fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 },
  subtitle: { fontSize: 12, color: '#666', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  emptyDay: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18,
    borderLeftWidth: 4, borderLeftColor: '#CCC',
  },
  emptyDayText: { color: '#999', marginTop: 6 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#C0392B', marginBottom: 8 },
  errorBody: { color: '#444', textAlign: 'center' },
});
