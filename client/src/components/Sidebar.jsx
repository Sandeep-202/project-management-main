import { NavLink } from "react-router-dom";
import {
  FolderOpenIcon,
  LayoutDashboardIcon,
  UsersIcon,
} from "lucide-react";

const Sidebar = ({ isSidebarOpen }) => {
  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboardIcon },
    { name: "Projects", href: "/projects", icon: FolderOpenIcon },
    { name: "Team", href: "/team", icon: UsersIcon },
  ];

  return (
    <div
      className={`z-10 bg-white dark:bg-zinc-900 min-w-68 flex flex-col h-screen border-r border-gray-200 dark:border-zinc-800 max-sm:absolute transition-all ${
        isSidebarOpen ? "left-0" : "-left-full"
      }`}
    >
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Project Manager</h1>

        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 py-2 px-4 rounded mb-2 ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;