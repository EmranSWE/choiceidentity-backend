export enum ENUM_USER_ROLE {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  AFFILIATE = 'affiliate',
}


export enum ENUM_GENDER {
  MALE = 'male',
  FEMALE = 'female',
 OTHERS = 'others'
}


export const allUserRoles = Object.values(ENUM_USER_ROLE);