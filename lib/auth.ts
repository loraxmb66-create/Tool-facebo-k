
import NextAuth from "next-auth"
import Facebook from "next-auth/providers/facebook"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./prisma"

const FACEBOOK_API_VERSION = "v20.0";

async function getLongLivedUserAccessToken(shortLivedToken: string): Promise<string | null> {
    const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${shortLivedToken}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.access_token || null;
    } catch (error) {
        console.error("Error getting long-lived user access token:", error);
        return null;
    }
}

async function getPages(longLivedUserToken: string): Promise<any[]> {
    const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/accounts?access_token=${longLivedUserToken}&fields=id,name,access_token`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Error fetching pages:", error);
        return [];
    }
}


export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "email,pages_show_list,pages_manage_posts,pages_read_engagement,business_management",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "facebook" && account.access_token) {
        const longLivedToken = await getLongLivedUserAccessToken(account.access_token);
        if (longLivedToken) {
            const pages = await getPages(longLivedToken);
            if(user.id) {
                for (const page of pages) {
                    await prisma.page.upsert({
                        where: { facebookPageId: page.id },
                        update: {
                            name: page.name,
                            accessToken: page.access_token,
                        },
                        create: {
                            facebookPageId: page.id,
                            name: page.name,
                            accessToken: page.access_token,
                            userId: user.id,
                        },
                    });
                }
            }
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/',
  },
})
