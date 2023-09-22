import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import lodash from "lodash";

import { ErrorCode, ErrorObject, handleResolverError } from "../handle-errors";
import {
  SignUpInput,
  GraphQLContext,
  SignInInput,
  SignInResponse,
} from "../../types";

const validateOption: {
  [condition: string]: (data: string) => ErrorObject | null;
} = {
  email: (data: string): ErrorObject | null => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (lodash.isEmpty(data))
      return {
        message: "This field can't blank!",
        code: "BAD_REQUEST",
        status: ErrorCode.BAD_REQUEST,
      };

    if (!emailRegex.test(data))
      return {
        message: "This field must email!",
        code: "BAD_REQUEST",
        status: ErrorCode.BAD_REQUEST,
      };

    return null;
  },
  password: (data: string): ErrorObject | null => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*\W).*$/;

    if (lodash.isEmpty(data.trim()))
      return {
        message: "This field can't blank!",
        code: "BAD_REQUEST",
        status: ErrorCode.BAD_REQUEST,
      };

    if (!passwordRegex.test(data.trim()))
      return {
        message:
          "Password must contains uppercase, lowercase, special character & numeric value",
        code: "BAD_REQUEST",
        status: ErrorCode.BAD_REQUEST,
      };

    return null;
  },
};

const validAccountInput = (inputs: {
  username?: string;
  email: string;
  password: string;
}): { isValid: boolean; err?: ErrorObject } => {
  const { username, email, password } = inputs;

  if (username && lodash.isEmpty(username.trim()))
    return {
      isValid: false,
      err: {
        message: "This field can't blank!",
        code: "BAD_REQUEST",
        status: ErrorCode.BAD_REQUEST,
      },
    };

  const emailError = validateOption["email"](email);
  if (emailError)
    return {
      isValid: false,
      err: emailError,
    };

  const passwordError = validateOption["password"](password);
  if (passwordError)
    return {
      isValid: false,
      err: passwordError,
    };

  return { isValid: true };
};

const resolvers = {
  Mutation: {
    signUp: async (
      _: any,
      { inputs }: { inputs: SignUpInput },
      context: GraphQLContext
    ): Promise<boolean> => {
      const validateInput = validAccountInput(inputs);

      if (!validateInput.isValid) handleResolverError(validateInput.err);

      const { prisma } = context;

      try {
        const userExist = await prisma.user.findUnique({
          where: {
            email: inputs.email,
          },
          select: {
            id: true,
          },
        });

        if (userExist) {
          const accountByUser = await prisma.account.findMany({
            where: {
              userId: userExist.id,
            },
            select: {
              id: true,
              password: true,
            },
          });

          if (accountByUser?.[0]?.password)
            handleResolverError({
              message: "Account has created!",
              code: "BAD_REQUEST",
              status: ErrorCode.BAD_REQUEST,
            });

          const hashPassword = await bcrypt.hash(inputs.password, 10);

          if (!accountByUser?.[0]) {
            await prisma.account.create({
              data: {
                userId: userExist.id,
                password: hashPassword,
                type: "jwt",
                provider: "credentials",
              },
            });

            return true;
          }

          await prisma.account.update({
            where: {
              id: accountByUser?.[0].id,
            },
            data: {
              password: hashPassword,
            },
          });

          return true;
        }

        const newUser = await prisma.user.create({
          data: {
            name: inputs.username,
            email: inputs.email,
          },
          select: {
            id: true,
          },
        });

        const hashPassword = await bcrypt.hash(inputs.password, 10);

        await prisma.account.create({
          data: {
            userId: newUser.id,
            password: hashPassword,
            type: "jwt",
            provider: "credentials",
          },
        });

        return true;
      } catch (error) {
        if (
          error?.extensions?.http?.status &&
          error?.extensions?.http?.status !== 500
        )
          throw error;

        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },
    signIn: async (
      _: any,
      { inputs }: { inputs: SignInInput },
      context: GraphQLContext
    ): Promise<SignInResponse> => {
      const validateInput = validAccountInput(inputs);

      if (!validateInput.isValid) handleResolverError(validateInput.err);

      const { prisma } = context;

      try {
        const userAccount = await prisma.user.findUnique({
          where: {
            email: inputs.email,
          },
          include: {
            accounts: {
              select: {
                id: true,
                password: true,
              },
            },
          },
        });

        const isValidPassword = await bcrypt.compare(
          inputs.password,
          userAccount.accounts?.[0]?.password
        );

        if (!isValidPassword)
          handleResolverError({
            message: "Email or Password is not correct!",
            code: "BAD_REQUEST",
            status: ErrorCode.BAD_REQUEST,
          });

        const token = jwt.sign(
          {
            id: userAccount.id,
            name: userAccount.name,
            image: userAccount.image,
          },
          process.env.TOKEN_SECRET,
          { expiresIn: "1h" }
        );

        return {
          id: userAccount.id,
          email: userAccount.email,
          name: userAccount.name,
          image: userAccount.image,
          accessToken: token,
        };
      } catch (error) {
        if (
          error?.extensions?.http?.status &&
          error?.extensions?.http?.status !== 500
        )
          throw error;

        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },
  },
};

export default resolvers;
