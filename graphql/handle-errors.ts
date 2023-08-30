import { GraphQLError, GraphQLFormattedError } from "graphql";

interface ErrorParams {
  message: string;
  code: string;
  status: number;
}

export const ErrorCode = {
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER: 500,
};

const handleErrorByType: {
  [condition: number]: () => void;
} = {
  400: () => {
    throw new GraphQLError("Bad request", {
      extensions: {
        code: "BAD_REQUEST",
        http: {
          status: 400,
        },
      },
    });
  },
  401: () => {
    throw new GraphQLError("Unauthenticated", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: {
          status: 401,
        },
      },
    });
  },
  404: () => {
    throw new GraphQLError("Not found", {
      extensions: {
        code: "NOT_FOUND",
        http: {
          status: 404,
        },
      },
    });
  },
  500: () => {
    throw new GraphQLError("Some thing went wrong", {
      extensions: {
        code: "INTERNAL_SERVER",
        http: {
          status: 500,
        },
      },
    });
  },
};

export const handleResolverError = (error: number | ErrorParams) => {
  if (typeof error !== "number")
    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        http: {
          status: error.status,
        },
      },
    });

  handleErrorByType[error]();
};

export const formatError = (
  formatedError: GraphQLFormattedError
): GraphQLFormattedError => {
  return {
    message: formatedError?.message,
  };
};
