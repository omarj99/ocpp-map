import axios from "axios";
import getBaseUrls from "../app/modules/helper";const url = getBaseUrls().DASHBOARDS_URL;

const API = axios.create({
  baseURL: `${url}`,
  headers: {
    Accept: "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const lsValue = localStorage.getItem("kt-auth-react-v");
    if (lsValue) {
      const parsedValue = JSON.parse(lsValue);
      if (parsedValue?.api_token) {
        config.headers.Authorization = Bearer `${parsedValue.api_token}`;
      }
    }
    const i18nConfigString = localStorage.getItem("i18nConfig");
    let selectedLang = "en";
    if (i18nConfigString) {
      try {
        const i18nConfig = JSON.parse(i18nConfigString);
        console.log(i18nConfig.selectedLang);
        
        selectedLang = i18nConfig.selectedLang || 'en';
      } catch (error) {
        console.error('Failed to parse i18nConfig:', error);
      }
    }
    config.headers['lang'] = selectedLang;
    return config;
  },
  (err) => Promise.reject(err)
);

export default API;