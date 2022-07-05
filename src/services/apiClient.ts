import { HeadersDefaults } from 'axios'

import { setupAPIClient } from "./api";

export const api = setupAPIClient();

interface CommonHeaderProperties extends HeadersDefaults {
  Authorization: string;
}

export const replaceToken = (token: string) => {
  api.defaults.headers = { ...api.defaults.headers, Authorization: `Bearer ${token}`} as CommonHeaderProperties;
}