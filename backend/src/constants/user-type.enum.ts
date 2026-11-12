/**
 * System-wide User Types
 * Derived from [Config].[UserType] in sch:
 * 1 = SuperAdmin (SA) - SaaS Platform Owner (/admin)
 * 2 = ClientAdmin (CA) - Water Business / Plant Owner (/business)
 * 3 = Employee (EM) - Office & Plant Internal Staff (Manager, Accountant, Dispatcher)
 * 4 = DeliveryDriver (DD) - Field Distribution Driver (/delivery)
 * 5 = Customer (CU) - Water Consumer / Client Portal (/portal)
 */

export enum UserType {
  SUPER_ADMIN = "SuperAdmin",
  CLIENT_ADMIN = "ClientAdmin",
  EMPLOYEE = "Employee",
  DELIVERY_DRIVER = "DeliveryDriver",
  CUSTOMER = "Customer",
}

export enum UserTypeId {
  SUPER_ADMIN = 1,
  CLIENT_ADMIN = 2,
  EMPLOYEE = 3,
  DELIVERY_DRIVER = 4,
  CUSTOMER = 5,
}

export enum UserTypeCode {
  SUPER_ADMIN = "SA",
  CLIENT_ADMIN = "CA",
  EMPLOYEE = "EM",
  DELIVERY_DRIVER = "DD",
  CUSTOMER = "CU",
}

export const USER_TYPE_LABELS: Record<UserType, string> = {
  [UserType.SUPER_ADMIN]: "Super Admin",
  [UserType.CLIENT_ADMIN]: "Client Admin",
  [UserType.EMPLOYEE]: "Employee",
  [UserType.DELIVERY_DRIVER]: "Delivery Driver",
  [UserType.CUSTOMER]: "Customer",
};
