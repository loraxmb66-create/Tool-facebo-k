"use client";

import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
// @ts-ignore
import { Post } from '@prisma/client';
import { Card, CardContent } from '../ui/Card';

const locales = {
  'vi': vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: vi }),
  getDay,
  locales,
});

interface ContentCalendarProps {
    posts: Post[];
}

const statusColors = {
    SCHEDULED: '#3b82f6', // blue-500
    PUBLISHED: '#22c55e', // green-500
    FAILED: '#ef4444', // red-500
    DRAFT: '#6b7280', // gray-500
}

export default function ContentCalendar({ posts }: ContentCalendarProps) {
    const events = posts
        .filter(post => post.status === 'SCHEDULED' || post.status === 'PUBLISHED')
        .map(post => ({
            title: post.content.substring(0, 30) + '...',
            start: post.scheduledAt || post.publishedAt,
            end: post.scheduledAt || post.publishedAt,
            allDay: false,
            resource: post,
        }));
    
    const eventStyleGetter = (event: any) => {
        const backgroundColor = statusColors[event.resource.status as keyof typeof statusColors] || statusColors.DRAFT;
        const style = {
            backgroundColor,
            borderRadius: '5px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
        };
        return {
            style: style
        };
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div style={{ height: '70vh' }}>
                     <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        culture='vi'
                        messages={{
                            next: "Sau",
                            previous: "Trước",
                            today: "Hôm nay",
                            month: "Tháng",
                            week: "Tuần",
                            day: "Ngày",
                            agenda: "Lịch trình",
                            date: "Ngày",
                            time: "Thời gian",
                            event: "Sự kiện",
                            noEventsInRange: "Không có sự kiện nào trong khoảng thời gian này.",
                        }}
                        eventPropGetter={eventStyleGetter}
                    />
                </div>
            </CardContent>
        </Card>
    );
}