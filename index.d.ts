import { Request, Response, NextFunction } from 'express';

export const quotiAuth = new QuotiAuth();

// todo: Obtive esse type analisando diretamente o log quando executamos a função getUserData. É isso mesmo?
type UserData = Partial<{
  id: number;
  uuid: string;
  name: string;
  gender: string;
  user: string;
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
  userCreated: string | boolean;
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
  Groups: { id: number; name: string }[];
  Permissions: { id: number; name: string }[];
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

  getUserData(data: {
    token: string;
    orgSlug: string;
  }): Promise<UserData | unknown>;

  validateSomePermissionCluster(
    permissions: QuotiPermissions,
  ): ValidateSomePermissionClusterMiddlewareAux2;
}
