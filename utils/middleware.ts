import jwt from "jsonwebtoken";

export type AuthUser = {
  email: string;
  name: string;
  picture?: string;
};

/**
 * Middleware to authenticate API requests using JWT from Authorization header
 * @param handler The API route handler to be protected
 */
export function withAuth<T extends Response>(
  handler: (req: Request, user: AuthUser) => Promise<T>
) {
  return async (req: Request): Promise<T | Response> => {
    try {
      // Extract the token from the Authorization header
      const authHeader = req.headers.get("authorization");
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return Response.json(
          { error: "Missing or invalid authorization header" },
          { status: 401 }
        );
      }
      
      const token = authHeader.split(" ")[1];
      
      if (!token) {
        return Response.json(
          { error: "No token provided" },
          { status: 401 }
        );
      }
      
      // Verify the JWT token
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        return Response.json(
          { error: "Server misconfiguration" },
          { status: 500 }
        );
      }
      
      // Verify and decode the token
      const decoded = jwt.verify(token, jwtSecret) as AuthUser;
      
      // Call the handler with the authenticated user
      return await handler(req, decoded);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return Response.json(
          { error: "Invalid token" },
          { status: 401 }
        );
      } else if (error instanceof jwt.TokenExpiredError) {
        return Response.json(
          { error: "Token expired" },
          { status: 401 }
        );
      } else {
        console.error("Auth error:", error);
        return Response.json(
          { error: "Authentication failed" },
          { status: 500 }
        );
      }
    }
  };
}