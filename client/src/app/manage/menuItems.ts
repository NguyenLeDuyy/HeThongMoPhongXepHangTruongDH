import { Role } from "@/constants/type";
import {
  Home,
  ShoppingCart,
  Users2,
  Salad,
  Table,
  BarChart,
  ClipboardList,
} from "lucide-react";

const menuItems = [
  {
    title: "Trang chủ",
    Icon: Home,
    href: "/",
    roles: [Role.Employee, Role.Owner],
  },
  // {
  //   title: "Bảng điều khiển",
  //   Icon: BarChart,
  //   href: "/manage/dashboard",
  //   roles: [Role.Employee, Role.Owner],
  // },
  // {
  //   title: "Đơn hàng",
  //   Icon: ShoppingCart,
  //   href: "/manage/orders",
  //   roles: [Role.Employee, Role.Owner],
  // },
  {
    title: "Hàng đợi",
    Icon: ClipboardList, // Icon cho mục hàng đợi
    href: "/manage/queues",
    roles: [Role.Owner, Role.Employee],
  },
  // {
  //   title: "Bàn ăn",
  //   Icon: Table,
  //   href: "/manage/tables",
  //   roles: [Role.Employee, Role.Owner],
  // },
  // {
  //   title: "Món ăn",
  //   Icon: Salad,
  //   href: "/manage/dishes",
  //   roles: [Role.Employee, Role.Owner],
  // },
  {
    title: "Nhân viên",
    Icon: Users2,
    href: "/manage/accounts",
    roles: [Role.Owner],
  },
];

export default menuItems;
