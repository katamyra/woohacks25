"use client";

import { Provider } from 'react-redux';
import store from './store'; // adjust the path if necessary

export default function ClientProviders({ children }) {
  return <Provider store={store}>{children}</Provider>;
} 