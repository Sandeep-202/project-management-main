// import { useState, useEffect } from "react";
// import Navbar from "../components/Navbar";
// import Sidebar from "../components/Sidebar";
// import { Outlet } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { loadTheme } from "../features/themeSlice";
// import { Loader2Icon } from "lucide-react";

// import {
//   useUser,
//   SignIn,
//   useAuth,
//   CreateOrganization,
// } from "@clerk/clerk-react";

// import { fetchWorkspaces } from "../features/workspaceSlice";

// const Layout = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const dispatch = useDispatch();

//   const { loading, workspaces } = useSelector(
//     (state) => state.workspace
//   );

//   const { user, isLoaded } = useUser();
//   const { getToken } = useAuth();

//   /* =========================
//      LOAD THEME ONCE
//   ========================= */
//   useEffect(() => {
//     dispatch(loadTheme());
//   }, [dispatch]);

//   /* =========================
//      LOAD WORKSPACES ONCE
//   ========================= */
//   useEffect(() => {
//     const loadWorkspaces = async () => {
//       if (!isLoaded || !user) return;
//       if (workspaces.length > 0) return;

//       try {
//         const token = await getToken();

//         dispatch(fetchWorkspaces({ getToken: () => token }));
//       } catch (error) {
//         console.log("Error fetching workspaces:", error);
//       }
//     };

//     loadWorkspaces();
//   }, [isLoaded, user, workspaces.length, dispatch, getToken]);

//   /* =========================
//      NO USER SCREEN
//   ========================= */
//   if (!user) {
//     return (
//       <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-950">
//         <SignIn />
//       </div>
//     );
//   }

//   /* =========================
//      LOADING SCREEN
//   ========================= */
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
//         <Loader2Icon className="size-7 text-blue-500 animate-spin" />
//       </div>
//     );
//   }

//   /* =========================
//      NO WORKSPACE SCREEN
//   ========================= */
//   if (user && workspaces.length === 0) {
//     return (
//       <div className="min-h-screen flex justify-center items-center">
//         <CreateOrganization />
//       </div>
//     );
//   }

//   /* =========================
//      MAIN APP LAYOUT
//   ========================= */
//   return (
//     <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
//       <Sidebar
//         isSidebarOpen={isSidebarOpen}
//         setIsSidebarOpen={setIsSidebarOpen}
//       />

//       <div className="flex-1 flex flex-col h-screen">
//         <Navbar
//           isSidebarOpen={isSidebarOpen}
//           setIsSidebarOpen={setIsSidebarOpen}
//         />

//         <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Layout;





import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loadTheme } from "../features/themeSlice";
import { Loader2Icon } from "lucide-react";

import {
  useUser,
  SignIn,
} from "@clerk/clerk-react";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const dispatch = useDispatch();

  const { user, isLoaded } = useUser();

  /* =========================
     LOAD THEME
  ========================= */

  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  /* =========================
     AUTH LOADING
  ========================= */

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  /* =========================
     NO USER
  ========================= */

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-950">
        <SignIn />
      </div>
    );
  }

  /* =========================
     MAIN APP
  ========================= */

  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col h-screen">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;