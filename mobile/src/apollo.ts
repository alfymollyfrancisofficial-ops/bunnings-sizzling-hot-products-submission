import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { Platform } from 'react-native';

// Android emulator can't reach 'localhost' on the host - it sees 10.0.2.2.
// iOS simulator and web can use localhost directly.
// For a physical device, set EXPO_PUBLIC_GRAPHQL_URL to your laptop's LAN IP.
const fallback = Platform.OS === 'android'
  ? 'http://10.0.2.2:4000/'
  : 'http://localhost:4000/';

const uri = process.env.EXPO_PUBLIC_GRAPHQL_URL ?? fallback;

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri }),
  cache: new InMemoryCache(),
});
