import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GooglePayload {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export const verifyGoogleIdToken = async (idToken: string): Promise<GooglePayload | null> => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("⚠️ GOOGLE_CLIENT_ID is not configured in environment variables.");
      return null;
    }

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (payload && payload.email) {
        return {
          googleId: payload.sub,
          email: payload.email,
          emailVerified: !!payload.email_verified,
          name: payload.name,
          picture: payload.picture,
        };
      }
    } catch (_err) {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (response.ok) {
        const userInfo = (await response.json()) as {
          sub?: string;
          email?: string;
          email_verified?: boolean;
          name?: string;
          picture?: string;
        };

        if (userInfo.sub && userInfo.email) {
          return {
            googleId: userInfo.sub,
            email: userInfo.email,
            emailVerified: !!userInfo.email_verified,
            name: userInfo.name,
            picture: userInfo.picture,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Failed to verify Google token:", error);
    return null;
  }
};
