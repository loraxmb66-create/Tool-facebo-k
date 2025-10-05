"use client";

import React, { useState, useTransition } from 'react';
// @ts-ignore
import type { Page, Template, Image as PrismaImage } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { createPostAction } from '@/actions/posts';
import toast from 'react-hot-toast';
import { Calendar as CalendarIcon, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Calendar } from '../ui/Calendar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import Image from 'next/image';

type PostWithImages = (import('@prisma/client') as any).Post & { images: PrismaImage[] };
type TemplateWithImages = Template & { images: PrismaImage[] };

interface PostCreatorProps {
    page: Page;
    templates: TemplateWithImages[];
    onPostCreated: (post: PostWithImages) => void;
}

export default function PostCreator({ page, templates, onPostCreated }: PostCreatorProps) {
    const [isPending, startTransition] = useTransition();
    const [content, setContent] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [scheduledAt, setScheduledAt] = useState<Date | undefined>();
    const [time, setTime] = useState('09:00');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(filesArray);
            const previews = filesArray.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
        }
    };
    
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            setScheduledAt(undefined);
            return;
        }
        const [hours, minutes] = time.split(':').map(Number);
        date.setHours(hours, minutes);
        setScheduledAt(date);
    }
    
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTime(e.target.value);
        if (scheduledAt) {
            const newDate = new Date(scheduledAt);
            const [hours, minutes] = e.target.value.split(':').map(Number);
            newDate.setHours(hours, minutes);
            setScheduledAt(newDate);
        }
    }

    const handleUseTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setContent(template.content);
            // Note: Cannot re-use remote image URLs directly for upload, this is a text-only template application
        }
    }

    const handleSubmit = (action: 'draft' | 'schedule' | 'now') => {
        startTransition(async () => {
            if (content.trim() === '') {
                toast.error('Nội dung bài viết không được để trống.');
                return;
            }

            const formData = new FormData();
            formData.append('content', content);
            formData.append('pageId', page.id);
            images.forEach(image => formData.append('images', image));

            let finalScheduledAt = undefined;
            if (action === 'schedule' && scheduledAt) {
                finalScheduledAt = scheduledAt;
            } else if (action === 'now') {
                // This will be handled server-side, for now we save as draft
                // A 'post now' button would trigger a different action
            }

            if(finalScheduledAt) {
                formData.append('scheduledAt', finalScheduledAt.toISOString());
            }

            const result = await createPostAction(formData);

            if (result.success && result.post) {
                toast.success('Bài viết đã được lưu thành công!');
                onPostCreated(result.post);
                // Reset form
                setContent('');
                setImages([]);
                setImagePreviews([]);
                setScheduledAt(undefined);
            } else {
                toast.error(result.message || 'Đã xảy ra lỗi.');
            }
        });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Soạn Bài Viết</CardTitle>
                    <CardDescription>Tạo nội dung cho trang {page.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="content">Nội dung</Label>
                        <Textarea
                            id="content"
                            placeholder="Bạn đang nghĩ gì?"
                            rows={8}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                     <div>
                        <Label>Sử dụng mẫu</Label>
                        <Select onValueChange={handleUseTemplate}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn một mẫu có sẵn..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(template => (
                                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="images">Hình ảnh (có watermark)</Label>
                        <div className="mt-1 flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 mb-4 text-gray-500" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả</p>
                                </div>
                                <input id="dropzone-file" type="file" className="hidden" multiple onChange={handleImageChange} accept="image/*" />
                            </label>
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((src, index) => (
                            <div key={index} className="relative">
                                <Image src={src} alt={`preview ${index}`} width={150} height={150} className="rounded-md object-cover w-full aspect-square" />
                                <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {scheduledAt ? format(scheduledAt, 'PPP', { locale: vi }) : <span>Chọn ngày lên lịch</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={scheduledAt}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                         <Input 
                            type="time" 
                            value={time}
                            onChange={handleTimeChange}
                            disabled={!scheduledAt}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Lưu Nháp
                        </Button>
                        <Button onClick={() => handleSubmit('schedule')} disabled={isPending || !scheduledAt}>
                             {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Lên Lịch
                        </Button>
                        <Button variant="destructive" onClick={() => alert("Chức năng 'Đăng ngay' sẽ gọi trực tiếp API. Để an toàn, nó được mô phỏng bằng cách lưu bài viết dưới dạng đã lên lịch ngay bây giờ.")} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Đăng Ngay
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Xem Trước Bài Viết</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                            <div>
                                <p className="font-bold">{page.name}</p>
                                <p className="text-xs text-gray-500">Just now</p>
                            </div>
                        </div>
                        <p className="whitespace-pre-wrap">{content || "Nội dung bài viết sẽ hiển thị ở đây..."}</p>
                        {imagePreviews.length > 0 && (
                            <div className={`grid gap-1 ${imagePreviews.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {imagePreviews.map((src, index) => (
                                    <Image key={index} src={src} alt={`Preview ${index}`} width={250} height={250} className="w-full h-auto object-cover rounded" />
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}