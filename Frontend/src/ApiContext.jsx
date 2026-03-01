import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { accessTokenContext } from "./AuthContext";

export const apiContext = createContext(null);

export function ApiProvider({ children }) {
  const {
    accessToken,
    setAccessToken,
    handleLogout,
    getRefreshToken, 
  } = useContext(accessTokenContext);

  const api = useMemo(() => {
    return axios.create({ baseURL: "http://localhost:5000" });
  }, []);


  const accessTokenRef = useRef(accessToken);
  const logoutRef = useRef(handleLogout);
  const getRefreshTokenRef = useRef(getRefreshToken);

  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);
  useEffect(() => { logoutRef.current = handleLogout; }, [handleLogout]);
  useEffect(() => { getRefreshTokenRef.current = getRefreshToken; }, [getRefreshToken]);

  const refreshPromiseRef = useRef(null);

  useEffect(() => {

    const reqId = api.interceptors.request.use((config) => {
      const token = accessTokenRef.current;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });


    const resId = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;

        if (!error.response || error.response.status !== 401) {
          return Promise.reject(error);
        }

        if (original._retry) return Promise.reject(error);
        original._retry = true;

        try {
          if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = (async () => {
              const rt = getRefreshTokenRef.current?.();
              if (!rt) throw new Error("No refresh token");

              const r = await axios.post(
                "http://localhost:5000/get-access-token",
                {},
                { headers: { Authorization: `Bearer ${rt}` } }
              );

              return r.data.accessToken;
            })();
          }

          const newAccess = await refreshPromiseRef.current;
          refreshPromiseRef.current = null;

          setAccessToken(newAccess);

          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch (e) {
          refreshPromiseRef.current = null;
          await logoutRef.current?.();
          return Promise.reject(e);
        }
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [api, setAccessToken]);

  return <apiContext.Provider value={{ api }}>{children}</apiContext.Provider>;
}