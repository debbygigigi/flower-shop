import { Access } from 'payload'

export enum Role {
  Admin = 'admin',
  Partner = 'partner',
}

export const admin: Access = ({ req: { user } }) => {
  return Boolean(user?.role?.includes(Role.Admin))
}

export const partner: Access = ({ req: { user } }) => {
  return Boolean(user?.role?.includes(Role.Partner))
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
