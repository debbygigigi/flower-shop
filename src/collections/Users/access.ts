import { Access } from 'payload'

export enum Role {
  Admin = 'admin',
  Vendor = 'vendor',
}

export const admin: Access = ({ req: { user } }) => {
  return Boolean(user?.role?.includes(Role.Admin))
}

export const vendor: Access = ({ req: { user } }) => {
  return Boolean(user?.role?.includes(Role.Vendor))
}
export const owner: Access = ({ req: { user } }) => {
  return {
    id: {
      equals: user?.id,
    },
  }
}

export const adminOrOwner: Access = (props) => {
  return admin(props) || owner(props)
}

export const anyone: Access = ({ req: { user } }) => Boolean(user)
