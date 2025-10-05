"use client";

import React, { useTransition } from 'react';
// @ts-ignore
import { Post } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { checkScheduledPosts } from '@/actions/posts';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface PostHistoryProps {
    posts: Post[];
    pageId: string;
}

const statusVariant: { [key in Post['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    DRAFT: 'secondary',
    SCHEDULED: 'default',
    PUBLISHED: 'outline',
    FAILED: 'destructive',
}

const statusText: { [key in Post['status']]: string } = {
    DRAFT: 'Nháp',
    SCHEDULED: 'Đã lên lịch',
    PUBLISHED: 'Đã đăng',
    FAILED: 'Thất bại',
}

export default function PostHistory({ posts }: PostHistoryProps) {
    const [isPending, startTransition] = useTransition();

    const handleCheckScheduled = () => {
        startTransition(async () => {
            toast.loading('Đang kiểm tra các bài viết đã lên lịch...');
            const result = await checkScheduledPosts();
            toast.dismiss();
            if (result.success) {
                toast.success(`Hoàn tất! Đã đăng ${result.publishedCount} bài viết.`);
            } else {
                toast.error('Kiểm tra thất bại.');
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Lịch Sử Bài Viết</CardTitle>
                        <CardDescription>Xem lại tất cả các bài viết của bạn.</CardDescription>
                    </div>
                    <Button onClick={handleCheckScheduled} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kiểm Tra Lịch Đăng
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nội dung</th>
                                <th scope="col" className="px-6 py-3">Trạng thái</th>
                                <th scope="col" className="px-6 py-3">Thời gian</th>
                                <th scope="col" className="px-6 py-3">Link Facebook</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map(post => (
                                <tr key={post.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 max-w-sm">
                                        <p className="truncate">{post.content}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={statusVariant[post.status]}>{statusText[post.status]}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {post.status === 'SCHEDULED' && post.scheduledAt && format(post.scheduledAt, 'Pp', { locale: vi })}
                                        {post.status === 'PUBLISHED' && post.publishedAt && format(post.publishedAt, 'Pp', { locale: vi })}
                                    </td>
                                    <td className="px-6 py-4">
                                        {post.facebookPostId ? (
                                            <a 
                                                href={`https://facebook.com/${post.facebookPostId}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="font-medium text-blue-600 hover:underline"
                                            >
                                                Xem bài viết
                                            </a>
                                        ) : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {posts.length === 0 && <p className="text-center text-gray-500 py-8">Chưa có bài viết nào.</p>}
            </CardContent>
        </Card>
    );
}