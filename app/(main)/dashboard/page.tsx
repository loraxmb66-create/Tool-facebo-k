
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    const pages = await prisma.page.findMany({
        where: { userId: session.user.id },
        orderBy: { name: 'asc' }
    });

    const posts = await prisma.post.findMany({
        where: { page: { userId: session.user.id } },
        include: { images: true },
        orderBy: { createdAt: 'desc' }
    });

    const templates = await prisma.template.findMany({
        where: { userId: session.user.id },
        include: { images: true },
        orderBy: { name: 'asc' }
    });

    return (
        <DashboardClient
            user={session.user}
            initialPages={pages}
            initialPosts={posts}
            initialTemplates={templates}
        />
    );
}
