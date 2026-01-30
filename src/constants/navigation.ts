import { HomeIcon, QrCodeIcon, TruckIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export type MenuItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  match?: (path: string) => boolean;
};

export const MENU_ITEMS: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: HomeIcon,
  },
  {
    name: "QR Generation",
    href: "/qrgeneration",
    icon: QrCodeIcon,
    match: (path) => path.startsWith("/qrgeneration"),
  },
  {
    name: "SJ Antar Plant",
    href: "/sjantarplant",
    icon: TruckIcon,
    match: (path) => path.startsWith("/sjantarplant"),
  },
  {
    name: "Receipt Antar Plant",
    href: "/receiptplant",
    icon: ClipboardDocumentCheckIcon,
    match: (path) => path.startsWith("/receiptplant"),
  },
];

// Helper function untuk mendapatkan Judul Halaman berdasarkan Pathname
export const getPageTitle = (pathname: string): string => {
  const matchedItem = MENU_ITEMS.find((item) => {
    // Jika ada custom matcher, pakai itu
    if (item.match) return item.match(pathname);
    // Default: exact match
    return item.href === pathname;
  });

  return matchedItem ? matchedItem.name : "Page";
};
