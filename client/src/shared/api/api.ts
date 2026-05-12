import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

// -----------------------------------------------------------------------------
// WARN: DO NOT ADD BROWSER-SPECIFIC CODE HERE (localStorage, window, import.meta, etc.)
// -----------------------------------------------------------------------------
// This file is imported by the Orval generator running in Node.js.
// Any browser API usage will cause the generation script (`npm run gen:api`) to fail.
//
// Put all interceptors, auth logic, storage access, and env reading in runtime files.
// Runtime base URL is configured in `App.tsx` via configureApiBaseUrl(...).
// -----------------------------------------------------------------------------

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export const configureApiBaseUrl = (baseUrl?: string) => {
  if (baseUrl) {
    api.defaults.baseURL = baseUrl;
  }
};

export type ErrorType<Error> = AxiosError<Error>;

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return api({
    ...config,
    ...options,
  }) as Promise<T>;
};

export default api;
