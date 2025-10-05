"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import sharp from "sharp";
import { writeFile, mkdir } from 'fs/promises';
import path from "path";
// @ts-ignore
import { PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Buffer } from "buffer";

const PostSchema = z.object({
  content: z.string().min(1, "Nội dung không được để trống"),
  pageId: z.string(),
  imageUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.date().optional(),
});

export async function createPostAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    const content = formData.get("content") as string;
    const pageId = formData.get("pageId") as string;
    const scheduledAtStr = formData.get("scheduledAt") as string | null;
    const imageFiles = formData.getAll("images") as File[];

    const validation = PostSchema.safeParse({
        content,
        pageId,
        scheduledAt: scheduledAtStr ? new Date(scheduledAtStr) : undefined,
    });

    if (!validation.success) {
        return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
    }

    try {
        const imageUrls: string[] = [];
        if (imageFiles.length > 0) {
            const uploadDir = path.join((process as any).cwd(), 'public', 'uploads');
            await mkdir(uploadDir, { recursive: true });
            const watermarkPath = path.join((process as any).cwd(), 'public', 'watermark.png');

            for (const file of imageFiles) {
                if (file.size === 0) continue;
                
                const buffer = Buffer.from(await file.arrayBuffer());
                const filename = `${Date.now()}-${file.name}`;
                const filepath = path.join(uploadDir, filename);

                await sharp(buffer)
                    .composite([{ input: watermarkPath, gravity: 'southeast' }])
                    .toFile(filepath);

                imageUrls.push(`/uploads/${filename}`);
            }
        }

        const newPost = await prisma.post.create({
            data: {
                content,
                pageId,
                status: validation.data.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
                scheduledAt: validation.data.scheduledAt,
                images: {
                    create: imageUrls.map(url => ({ url })),
                },
            },
            include: { images: true },
        });

        revalidatePath('/dashboard');
        return { success: true, post: newPost };
    } catch (error) {
        console.error("Error creating post:", error);
        return { success: false, message: "Đã xảy ra lỗi khi tạo bài viết." };
    }
}

export async function createTemplateAction(formData: FormData) {
    const session = await auth();
    if(!session?.user?.id) return { success: false, message: "Unauthorized" };

    const name = formData.get('name') as string;
    const content = formData.get('content') as string;

    if (!name || !content) {
        return { success: false, message: "Tên mẫu và nội dung không được để trống." };
    }

    try {
        await prisma.template.create({
            data: {
                name,
                content,
                userId: session.user.id,
            }
        });
        
        const templates = await prisma.template.findMany({ where: { userId: session.user.id }, include: { images: true }});
        revalidatePath('/dashboard');
        return { success: true, templates };
    } catch (error) {
        console.error("Error creating template:", error);
        return { success: false, message: "Đã xảy ra lỗi khi tạo mẫu." };
    }
}

export async function deleteTemplateAction(templateId: string) {
    const session = await auth();
    if(!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        await prisma.template.delete({
            where: { id: templateId, userId: session.user.id }
        });

        const templates = await prisma.template.findMany({ where: { userId: session.user.id }, include: { images: true }});
        revalidatePath('/dashboard');
        return { success: true, templates };
    } catch(error) {
        console.error("Error deleting template:", error);
        return { success: false, message: "Đã xảy ra lỗi khi xóa mẫu." };
    }
}

// In a real app, this would be triggered by a cron job.
// Here we just expose it as an action that could be triggered manually.
export async function checkScheduledPosts() {
  const postsToPublish = await prisma.post.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: {
        lte: new Date(),
      },
    },
    include: {
      page: true,
      images: true,
    },
  });

  for (const post of postsToPublish) {
    const { page, content, images } = post;
    const FACEBOOK_API_URL = `https://graph.facebook.com/v20.0`;

    try {
      let publishedPostId: string | null = null;

      if (images.length === 0) {
        // Publish text-only post
        const response = await fetch(`${FACEBOOK_API_URL}/${page.facebookPageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            access_token: page.accessToken,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Failed to publish text post');
        publishedPostId = data.id;

      } else {
        // Publish post with multiple images
        const attached_media: { media_fbid: string }[] = [];
        for (const image of images) {
          const imageUrl = `${process.env.NEXTAUTH_URL}${image.url}`;
          const uploadResponse = await fetch(`${FACEBOOK_API_URL}/${page.facebookPageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: imageUrl,
              published: false,
              access_token: page.accessToken,
            }),
          });
          const uploadData = await uploadResponse.json();
          if (!uploadResponse.ok) throw new Error(uploadData.error?.message || 'Failed to upload photo');
          attached_media.push({ media_fbid: uploadData.id });
        }

        const postResponse = await fetch(`${FACEBOOK_API_URL}/${page.facebookPageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: content,
              attached_media,
              access_token: page.accessToken,
            }),
          });
  
          const postData = await postResponse.json();
          if (!postResponse.ok) throw new Error(postData.error?.message || 'Failed to publish multi-photo post');
          publishedPostId = postData.id;
      }

      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          facebookPostId: publishedPostId,
        },
      });

    } catch (error: any) {
      console.error(`Failed to publish post ${post.id}:`, error);
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
    }
  }

  if (postsToPublish.length > 0) {
    revalidatePath('/dashboard');
  }

  return { success: true, publishedCount: postsToPublish.length };
}