"use client";

import { useAppContext } from "@/components/app-provider";
import { checkAndRefreshToken } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Những page sau sẽ không check refresh token
const UNAUTHENTICATED_PATH = ["/login", "/register", "/refresh-token"];
export default function RefreshToken() {
  const pathname = usePathname();
  const router = useRouter();
  const { socket, disconnectSocket } = useAppContext()
  // console.log(pathname);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let interval: any = null;
  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathname)) return;
    // Phải gọi lần đầu tiên, vì interval sẽ chạy sau tgian TIMEOUT
    const onRefreshToken = (force?: boolean) => {
      // console.log('refresh token')
      checkAndRefreshToken({
        onError: () => {
          clearInterval(interval);
          disconnectSocket()
          router.push("/login");
        },
        force
      });
    }
    onRefreshToken()
    // Timeout interval phải < accessToken's expired time
    // Ví dụ tgia hết hạn của AT là 10s thì 1s ta sẽ check 1 lần
    const TIMEOUT = 1000;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    interval = setInterval(
      onRefreshToken,
      TIMEOUT
    );

    if (socket?.connected) {
      onConnect();
    }

    function onConnect() {
      console.log("", socket?.id)
    }

    function onDisconnect() {
      console.log("disconnect")
    }

    function onRefreshTokenSocket() {
      onRefreshToken(true)
    }

    socket?.on("connect", onConnect);
    socket?.on("disconnect", onDisconnect);
    socket?.on("refresh-token", onRefreshTokenSocket);

    return () => {
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      socket?.off("refresh-token", onRefreshTokenSocket);
      clearInterval(interval);
    };
  }, [pathname, router, socket]);
  return null;
}
