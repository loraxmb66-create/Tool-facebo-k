"use client";

import React, { useState, useTransition, useRef } from 'react';
// @ts-ignore
import type { Template, Image as PrismaImage } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { createTemplateAction, deleteTemplateAction } from '@/actions/posts';
import toast from 'react-hot-toast';
import { Loader2, Trash2 } from 'lucide-react';

type TemplateWithImages = Template & { images: PrismaImage[] };

interface TemplateManagerProps {
    initialTemplates: TemplateWithImages[];
    onUpdate: (templates: TemplateWithImages[]) => void;
}

export default function TemplateManager({ initialTemplates, onUpdate }: TemplateManagerProps) {
    const [templates, setTemplates] = useState(initialTemplates);
    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const handleCreateTemplate = (formData: FormData) => {
        startTransition(async () => {
            const result = await createTemplateAction(formData);
            if (result.success && result.templates) {
                setTemplates(result.templates);
                onUpdate(result.templates);
                toast.success('Mẫu đã được tạo thành công!');
                formRef.current?.reset();
            } else {
                toast.error(result.message || 'Không thể tạo mẫu.');
            }
        });
    }

    const handleDeleteTemplate = (templateId: string) => {
        startTransition(async () => {
            const result = await deleteTemplateAction(templateId);
            if(result.success && result.templates) {
                setTemplates(result.templates);
                onUpdate(result.templates);
                toast.success('Mẫu đã được xóa.');
            } else {
                toast.error(result.message || 'Không thể xóa mẫu.');
            }
        });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Tạo Mẫu Mới</CardTitle>
                        <CardDescription>Lưu nội dung để tái sử dụng nhanh chóng.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form ref={formRef} action={handleCreateTemplate} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Tên mẫu</Label>
                                <Input id="name" name="name" required disabled={isPending} />
                            </div>
                            <div>
                                <Label htmlFor="content">Nội dung mẫu</Label>
                                <Textarea id="content" name="content" rows={6} required disabled={isPending} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Lưu Mẫu
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Các Mẫu Đã Lưu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {templates.length > 0 ? (
                            templates.map(template => (
                                <div key={template.id} className="border p-4 rounded-md flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold">{template.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{template.content}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)} disabled={isPending}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">Chưa có mẫu nào được tạo.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}