import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { validatePermissions } from "../utils/validatePermissions";

type UseCanParams = {
  permissions?: string[];
  roles?: string[];
}

export function useCan({ permissions = [], roles = []}: UseCanParams) {
  const { user, isAuthenticated } = useContext(AuthContext);
  if(!isAuthenticated) return false;
  const hasPermissions = validatePermissions({ user, permissions, roles });
  return hasPermissions;
}