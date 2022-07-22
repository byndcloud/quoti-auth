export type UserData = {
  user: string
  userCreated: 'true' | 'false'
  id: number
} & Partial<{
  uuid: string
  name: string
  gender: string
  pass: string
  passwordStrength: string
  cpf: string | number
  email: string
  telefones: string | null
  matricula: string | null
  ppessoaCodigo: null
  token: string
  tokenPasswordReset: string
  tokenPasswordResetExpirationTime: string
  tokenPasswordResetTimes: string
  registered: boolean
  lastLoginTime: string
  createdTime: string
  updatedTime: string
  userProfileId: number
  sync: boolean
  bio: string
  birthday: string
  instagramUrl: string
  facebookUrl: string
  twitterUrl: string
  linkedinUrl: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  deletedAt: string
  user_profile_id: number
  media_id: number
  image: string
  UsersProfile: { id: number; homePageDefault: string }
  Groups: { id: number; name: string; type: string; cod: string }[]
  Permissions: { id: number; name: string }[]
}>
