"use client";

import React, { useState, useMemo } from 'react';
import type { User } from 'next-auth';
// @ts-ignore
import type { Page, Post, Template, Image as PrismaImage } from '@prisma/client';
import { LogOut } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Button } from '@/components/ui/Button';
import { signOut } from 'next-auth/react';
import PostCreator from './PostCreator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import ContentCalendar from './ContentCalendar';
import PostHistory from './PostHistory';
import TemplateManager from './TemplateManager';
import Image from 'next/image';

type PostWithImages = Post & { images: PrismaImage[] };
type TemplateWithImages = Template & { images: PrismaImage[] };

interface DashboardClientProps {
    user: User;
    initialPages: Page[];
    initialPosts: PostWithImages[];
    initialTemplates: TemplateWithImages[];
}

export default function DashboardClient({ user, initialPages, initialPosts, initialTemplates }: DashboardClientProps) {
    const [pages, setPages] = useState<Page[]>(initialPages);
    const [posts, setPosts] = useState<PostWithImages[]>(initialPosts);
    const [templates, setTemplates] = useState<TemplateWithImages[]>(initialTemplates);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(initialPages[0]?.id || null);

    const handlePostCreated = (newPost: PostWithImages) => {
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };
    
    const handleTemplateUpdate = (updatedTemplates: TemplateWithImages[]) => {
        setTemplates(updatedTemplates);
    }
    
    const filteredPosts = useMemo(() => {
        if (!selectedPageId) return [];
        return posts.filter(post => post.pageId === selectedPageId);
    }, [posts, selectedPageId]);

    const selectedPage = pages.find(p => p.id === selectedPageId);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    {user.image && <Image src={user.image} alt={user.name || 'User Avatar'} width={48} height={48} className="rounded-full" />}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Chào mừng, {user.name}</h1>
                        <p className="text-gray-500">Quản lý các trang của bạn một cách dễ dàng.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {pages.length > 0 && (
                        <Select onValueChange={setSelectedPageId} defaultValue={selectedPageId ?? undefined}>
                            <SelectTrigger className="w-full md:w-[250px] bg-white">
                                <SelectValue placeholder="Chọn một trang..." />
                            </SelectTrigger>
                            <SelectContent>
                                {pages.map(page => (
                                    <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/' })}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main>
                {!selectedPageId ? (
                     <Card>
                        <CardHeader>
                            <CardTitle>Bắt đầu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-center text-gray-600">
                                {pages.length > 0 ? "Vui lòng chọn một trang để bắt đầu quản lý." : "Bạn chưa có trang nào được liên kết. Vui lòng đăng nhập lại để đồng bộ hóa các trang của bạn."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs defaultValue="create" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
                            <TabsTrigger value="create">Tạo Bài Viết</TabsTrigger>
                            <TabsTrigger value="calendar">Lịch Nội Dung</TabsTrigger>
                            <TabsTrigger value="history">Lịch Sử Đăng</TabsTrigger>
                            <TabsTrigger value="templates">Quản Lý Mẫu</TabsTrigger>
                        </TabsList>
                        <TabsContent value="create">
                            <PostCreator 
                                page={selectedPage} 
                                templates={templates} 
                                onPostCreated={handlePostCreated}
                            />
                        </TabsContent>
                        <TabsContent value="calendar">
                           <ContentCalendar posts={filteredPosts} />
                        </TabsContent>
                        <TabsContent value="history">
                            <PostHistory posts={filteredPosts} pageId={selectedPageId} />
                        </TabsContent>
                        <TabsContent value="templates">
                            <TemplateManager initialTemplates={templates} onUpdate={handleTemplateUpdate} />
                        </TabsContent>
                    </Tabs>
                )}
            </main>
        </div>
    );
}