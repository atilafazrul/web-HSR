import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Folder,
  User,
  ChevronDown,
  ChevronRight,
  Monitor,
  Wrench,
  BarChart3,
  Hammer,
  Menu,
  LogOut,
} from "lucide-react";

import { useLocation } from "react-router-dom";

export default function Sidebar({
  user,
  sidebarOpen,
  setSidebarOpen,
  logout,
  isExpanded = true,
  setIsExpanded,
  navigate,
  role = "admin",
}) {

  const location = useLocation();

  const [openDivisi, setOpenDivisi] = useState(() => {
    const saved = localStorage.getItem("sidebarDivisiOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [internalExpanded, setInternalExpanded] = useState(true);

  useEffect(() => {
    localStorage.setItem("sidebarDivisiOpen", JSON.stringify(openDivisi));
  }, [openDivisi]);

  const expanded = isExpanded !== undefined ? isExpanded : internalExpanded;

  const toggleSidebar = () => {
    if (setIsExpanded) {
      setIsExpanded(!isExpanded);
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";

  /* ================= ROUTE HELPER ================= */

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const basePath = isSuperAdmin ? "/super_admin" : "/admin";

  const allDivisis = [
    { name: "IT", path: "it", icon: <Monitor size={18} /> },
    { name: "Service", path: "service", icon: <Wrench size={18} /> },
    { name: "Kontraktor", path: "kontraktor", icon: <Hammer size={18} /> },
    { name: "Sales", path: "sales", icon: <BarChart3 size={18} /> },
  ];

  return (
    <aside
      className={`fixed z-40 top-0 left-0 h-full
      ${expanded ? "w-72" : "w-20"}
      text-white flex flex-col justify-between
      transform transition-all duration-300
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      style={{ backgroundColor: "#172238" }}
    >

      <div className="p-4">

        {/* TOGGLE */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 mb-6 rounded-lg hover:bg-slate-800"
        >
          <Menu size={24} />
        </button>


        {/* LOGO */}
        <div className="hidden lg:flex justify-center mb-10 relative">

          <img
            src="/images/LOGO HSR.png"
            alt="HSR"
            className={`h-14 transition-all ${expanded ? "opacity-100" : "opacity-0 w-0"}`}
          />

          {!expanded && (
            <img
              src="/images/LOGO HSR.png"
              alt="HSR"
              className="h-10 absolute"
            />
          )}
        </div>


        <div className="space-y-2">

          {/* DASHBOARD */}
          <div onClick={() => navigate(`${basePath}/dashboard`)}>
            <SidebarItem
              icon={<LayoutDashboard size={18} />}
              text="Dashboard"
              active={isActive(`${basePath}/dashboard`)}
              expanded={expanded}
            />
          </div>


          {/* DIVISI */}
          {isSuperAdmin && (

            <div
              className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              onClick={() => setOpenDivisi(!openDivisi)}
            >
              <div className="flex items-center">
                <Folder size={18} />
                <span className={`ml-3 ${expanded ? "block" : "hidden"}`}>
                  Divisi
                </span>
              </div>

              {expanded && (
                openDivisi
                  ? <ChevronDown size={16} />
                  : <ChevronRight size={16} />
              )}
            </div>
          )}


          {/* DIVISI LIST */}
          {isSuperAdmin && openDivisi && (

            <div className="space-y-1">

              {allDivisis.map((d) => (

                <div
                  key={d.name}
                  onClick={() => navigate(`${basePath}/${d.path}`)}
                >
                  <SidebarItem
                    icon={d.icon}
                    text={d.name}
                    active={isActive(`${basePath}/${d.path}`)}
                    expanded={expanded}
                    indented
                  />
                </div>
              ))}

            </div>
          )}


          {/* ADMIN: SINGLE DIVISI */}
          {isAdmin && !isSuperAdmin && (

            <div onClick={() => navigate(`${basePath}/${user?.divisi?.toLowerCase() || "service"}`)}>

              <SidebarItem
                icon={<Folder size={18} />}
                text={user?.divisi || "Service"}
                active={isActive(`${basePath}/${user?.divisi?.toLowerCase() || "service"}`)}
                expanded={expanded}
                indented
              />

            </div>
          )}


          {/* PROFILE */}
          <div onClick={() => navigate(`${basePath}/profile`)}>
            <SidebarItem
              icon={<User size={18} />}
              text="Profile"
              active={isActive(`${basePath}/profile`)}
              expanded={expanded}
            />
          </div>

        </div>
      </div>


      {/* LOGOUT */}
      <button
        onClick={logout}
        className="mx-4 mb-4 bg-red-500 hover:bg-red-600 py-3 rounded-xl font-medium shadow px-4 flex items-center"
      >
        <LogOut size={20} />

        {expanded && (
          <span className="ml-3">
            Logout
          </span>
        )}
      </button>

    </aside>
  );
}



/* ITEM */

const SidebarItem = ({
  icon,
  text,
  active,
  expanded,
  indented = false
}) => (

  <div
    className={`flex items-center py-2 rounded-lg cursor-pointer transition
    ${active ? "bg-blue-500" : "hover:bg-slate-800"}
    ${indented && expanded ? "pl-8 pr-4" : "px-4"}`}
  >

    <span className="w-[18px] flex justify-center">
      {icon}
    </span>

    {expanded && (
      <span className="ml-3 whitespace-nowrap">
        {text}
      </span>
    )}

  </div>
);