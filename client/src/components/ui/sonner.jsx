import useDarkMode from "./toggleTheme.jsx";
import { Toaster as Sonner, toast } from "sonner";

const Toaster = (props) => {
  const { isDark } = useDarkMode();

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      toastOptions={{
        duration: 3000,
        style: {
          background: isDark ? '#1A1A1A' : '#FFFFFF',
          border: isDark ? '1px solid #333' : '1px solid #E5E5E5',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          padding: '14px 16px',
        },
        classNames: {
          toast: "group toast font-medium",
          title: "text-[#1A1A1A] dark:text-white text-[15px]",
          description: "text-[#6B6B6B] dark:text-[#A1A1A1] text-[14px] mt-1",
          actionButton: "bg-[#1A1A1A] text-white rounded-full px-4 py-1.5 text-[14px] hover:bg-[#333]",
          cancelButton: "bg-[#F2F2F2] text-[#1A1A1A] rounded-full px-4 py-1.5 text-[14px]",
          closeButton: "bg-transparent text-[#6B6B6B] hover:text-[#1A1A1A]",
          icon: "mt-0.5",
          success: "text-green-600",
          error: "text-red-600",
          warning: "text-yellow-600",
          info: "text-blue-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
