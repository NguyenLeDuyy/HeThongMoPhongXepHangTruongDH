"use client";

import { useAppContext } from "@/components/app-provider";
import { Role } from "@/constants/type";
import { cn, handleErrorApi } from "@/lib/utils";
import { useGuestLogoutMutation } from "@/queries/useGuest";
import { RoleType } from "@/types/jwt.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const menuItems: {
  title: string,
  href: string,
  role?: RoleType[],
  hideWhenLoggedIn?: boolean
}[] = [
    {
      title: "Trang chủ",
      href: "/",
    },
    {
      title: "Món ăn",
      href: "/guest/menu", // Chưa đăng nhập thì vẫn có thể xem menu
      role: [Role.Guest]
    },
    {
      title: "Đơn hàng",
      href: "/guest/orders", // Chưa đăng nhập thì vẫn có thể xem menu
      role: [Role.Guest]
    },
    {
      title: "Đăng nhập",
      href: "/login",
      hideWhenLoggedIn: true
    },
    {
      title: "Quản lý",
      href: "/manage/dashboard",
      role: [Role.Owner, Role.Employee]
    },
  ];

// Server: Món ăn, Đơn hàng, Đăng nhập. Do sever không biết người dùng đã đăng nhập hay chưa
// Client: Đầu tiên sẽ hiển thị Món ăn, Đơn hàng, Đăng nhập.
// Sau đó Món ăn, Đơn hàng, Đăng nhập, Quản lý sẽ được hiển thị
// Do client biết người dùng đã đăng nhập hay chưa thông qua access token trong localStorage

export default function NavItems({ className }: { className?: string }) {
  const { role, setRole, disconnectSocket } = useAppContext();
  const router = useRouter();
  const logoutMutation = useGuestLogoutMutation();
  const logout = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logoutMutation.mutateAsync();
      setRole();
      disconnectSocket()
      router.push("/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      handleErrorApi({
        error,
      });
    }
  };

  return <>
    {menuItems.map((item) => {
      // Trường hợp đăng nhập thì chỉ hiện menu đăng nhập
      const isAuth = item.role && role && item.role.includes(role)
      // Trường hợp menu item có thể hiển thị dù cho đã đăng nhập hay chưa
      const canShow = (item.role === undefined && !item.hideWhenLoggedIn)  // dành cho nav Trang chủ
        || (!role && item.hideWhenLoggedIn) // danh cho nav Đăng nhập
      if (isAuth || canShow) {
        return (
          <Link href={item.href} key={item.href} className={className}>
            {item.title}
          </Link>
        );
      }
      return null;
    })}
    {role && <AlertDialog>
      <AlertDialogTrigger><div className={cn(className, 'cursor-pointer')}>
        Đăng xuất
      </div></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có muốn đăng xuất không?</AlertDialogTitle>
          <AlertDialogDescription>
            Việc đăng xuất có thể làm mất đi hóa đơn của bạn
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Thoát</AlertDialogCancel>
          <AlertDialogAction onClick={logout}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>}

  </>;
}
