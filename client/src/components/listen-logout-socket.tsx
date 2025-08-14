import { useAppContext } from "@/components/app-provider";
import { handleErrorApi } from "@/lib/utils";
import { useLogoutMutation } from "@/queries/useAuth";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react"

const UNAUTHENTICATED_PATH = ["/login", "/register", "/refresh-token"];

export default function ListenLogoutSocket() {
    const pathname = usePathname();
    const router = useRouter();
    const { isPending, mutateAsync } = useLogoutMutation();
    const { socket, setRole, disconnectSocket } = useAppContext();
    useEffect(() => {
        if (UNAUTHENTICATED_PATH.includes(pathname)) return;
        async function onLogout() {
            if (isPending) return;
            try {
                await mutateAsync();
                router.push("/");
                setRole();
                disconnectSocket()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                handleErrorApi({
                    error,
                });
            }
        }

        socket?.on("logout", onLogout);
        return () => {
            socket?.off("logout", onLogout);
        };

    }, [disconnectSocket, isPending, mutateAsync, pathname, router, setRole, socket])

    return null
}
