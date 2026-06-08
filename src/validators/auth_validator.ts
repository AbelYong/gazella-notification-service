import { expressjwt, GetVerificationKey } from "express-jwt";
import jwksRsa from "jwks-rsa";
import "dotenv/config";

const ISSUER_URL = process.env["ISSUER_URL"] || "http://localhost:4000/oidc";

export const requireAuth = expressjwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${ISSUER_URL}/jwks`
    }) as GetVerificationKey,

    audience: "urn:gazella:client",
    issuer: ISSUER_URL,
    algorithms: ["RS256"],
    
    requestProperty: "auth",
});

declare global {
    namespace Express {
        interface Request {
            auth?: {
                sub: string;
                email: string;
                scope: string;
                [key: string]: any;
            };
        }
    }
}
