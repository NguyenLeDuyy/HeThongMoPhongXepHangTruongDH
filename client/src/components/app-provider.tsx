/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RefreshToken from "@/components/refresh-token";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  decodeToken,
  generateSocketInstance,
  getAccessTokenFromLocalStorage,
  removeTokensFromLocalStorage,
} from "@/lib/utils";
import { RoleType } from "@/types/jwt.types";
import { Socket } from "socket.io-client";
import ListenLogoutSocket from "@/components/listen-logout-socket";

// Default:
// stateTime = 0,
// Setting: staleTime: 1000 * 60 // Thời gian fetch lại API cho các trang đã fetch API rồi là 1p
// gcTime:  5p // Thời gian đưa data vào sọt rác 

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const AppContext = createContext({
  isAuth: false,
  role: undefined as RoleType | undefined,
  setRole: (role?: RoleType | undefined) => { },
  socket: undefined as Socket | undefined,
  setSocket: (socket?: Socket | undefined) => { },
  disconnectSocket: () => { }
});

export const useAppContext = () => {
  return useContext(AppContext);
};
export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const count = useRef(0)
  const [socket, setSocket] = useState<Socket | undefined>()
  const [role, setRoleState] = useState<RoleType | undefined>();

  useEffect(() => {
    if (count.current === 0) {
      const accessToken = getAccessTokenFromLocalStorage();
      if (accessToken) {
        const { role } = decodeToken(accessToken)
        setRoleState(role)
        setSocket(generateSocketInstance(accessToken))
      }
      count.current++;
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    socket?.disconnect()
    setSocket(undefined)
  }, [socket, setSocket]
  )

  const setRole = useCallback((role?: RoleType | undefined) => {
    setRoleState(role);
    if (!role) {
      removeTokensFromLocalStorage();
    }
  }, []);

  const isAuth = Boolean(role)

  return (
    <AppContext.Provider value={{ isAuth, role, setRole, socket, setSocket, disconnectSocket }}>
      <QueryClientProvider client={queryClient}>
        {children}
        <RefreshToken />
        <ListenLogoutSocket />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AppContext.Provider>
  );
}
