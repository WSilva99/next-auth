type User = {
  permissions: string[];
  roles: string[];
}

type ValidatePermissionsParams = {
  user: User;
  permissions?: string[];
  roles?: string[];
}

export function validatePermissions({ user, permissions = [], roles = [] }: ValidatePermissionsParams) {
  if(!user.permissions)
    return false;
  
  if(permissions.length > 0) {
    const hasAllPermissions = permissions.every(permission => user.permissions.includes(permission));
    if(!hasAllPermissions) return false;
  }

  if(!user.roles)
    return false;

  if(roles.length > 0) {
    const hasAllRoles = roles.some(role => user.roles.includes(role));
    if(!hasAllRoles) return false;
  }

  return true;
}
