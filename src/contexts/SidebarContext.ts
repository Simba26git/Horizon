import { createContext, Dispatch, SetStateAction } from "react";

interface SidebarContextType {
  toggleSidebar: boolean;
  setToggleSidebar: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export const SidebarContext = createContext<Partial<SidebarContextType>>({});
