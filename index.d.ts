import { Request, Response, NextFunction } from 'express';

export const quotiAuth = new QuotiAuth();

type UserData = {user: string, userCreated: 'true' | 'false', id:number } & Partial<{
  uuid: string;
  name: string;
  gender: string;
  pass: string;
  passwordStrength: string;
  cpf: string | number;
  email: string;
  telefones: string | null;
  matricula: string | null;
  ppessoaCodigo: null;
  token: string;
  tokenPasswordReset: string;
  tokenPasswordResetExpirationTime: string;
  tokenPasswordResetTimes: string;
  registered: boolean;
  lastLoginTime: string;
  
  createdTime: string;
  updatedTime: string;
  userProfileId: number;
  sync: boolean;
  bio: string;
  birthday: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  user_profile_id: number;
  media_id: number;
  image: string;
  UsersProfile: { id: number; homePageDefault: string };
  Groups: { id: number; name: string; type: string; cod: string }[];
  Permissions: { id: number; name: string; }[];
}>;

type QuotiPermissions = string[][];
// todo: verificar o type logger. Provavelmente o logger do quoti não tem type console
type SetupConfig = {
  orgSlug?: string;
  apiKey?: string;
  getUserData?: unknown;
  logger?: Console;
};

type ValidateSomePermissionClusterMiddleware = (
  logger,
) => ValidateSomePermissionClusterMiddlewareAux;
type ValidateSomePermissionClusterMiddlewareAux = (
  validators: string[],
) => ValidateSomePermissionClusterMiddlewareAux2;
type ValidateSomePermissionClusterMiddlewareAux2 = (
  req: Request,
  res: Response,
  next: NextFunction,
) => boolean | null | Response;

declare class QuotiAuth {
  constructor(setupConfig?: SetupConfig)

  middleware(
    permissions: QuotiPermissions,
  ): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => null | void | Response;

  setup(setupConfig: SetupConfig): void;

  getUserData<T = UserData>(data: {
    token: string;
    orgSlug: string;
  }): Promise<T>;

  validateSomePermissionCluster(
    permissions: QuotiPermissions,
  ): ValidateSomePermissionClusterMiddlewareAux2;
}