

// @ts-ignore
import { PrismaClient, PostStatus } from '@prisma/client'
import { add } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  const user = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: {
      email: 'dev@example.com',
      name: 'Dev User',
    },
  })

  // Seed Pages (these are mock pages, real ones are fetched via API)
  const page1 = await prisma.page.upsert({
    where: { facebookPageId: 'mock_page_id_1' },
    update: {},
    create: {
      facebookPageId: 'mock_page_id_1',
      name: 'Cửa Hàng Thời Trang ABC',
      accessToken: 'mock_access_token_1',
      userId: user.id,
    },
  })

  const page2 = await prisma.page.upsert({
    where: { facebookPageId: 'mock_page_id_2' },
    update: {},
    create: {
      facebookPageId: 'mock_page_id_2',
      name: 'Quán Cà Phê XYZ',
      accessToken: 'mock_access_token_2',
      userId: user.id,
    },
  })

  console.log(`Created pages for user ${user.name}`)

  // Seed Templates
  await prisma.template.create({
    data: {
      name: 'Khuyến Mãi Cuối Tuần',
      content: '🔥 GIẢM GIÁ SỐC CUỐI TUẦN! 🔥\n\nToàn bộ sản phẩm được giảm giá 30%. Đừng bỏ lỡ cơ hội này!\n\n#sale #khuyenmai #cuoituan',
      userId: user.id,
      images: {
        create: [
          { url: 'https://picsum.photos/800/600?random=1' },
          { url: 'https://picsum.photos/800/600?random=2' },
        ],
      },
    },
  })

  await prisma.template.create({
    data: {
      name: 'Sản Phẩm Mới',
      content: '✨ HÀNG MỚI VỀ! ✨\n\nKhám phá bộ sưu tập mới nhất của chúng tôi. Chất lượng tuyệt vời, thiết kế độc đáo!\n\n#newarrival #thoitrang #phongcach',
      userId: user.id,
    },
  })
  
  await prisma.template.create({
    data: {
      name: 'Tuyển Dụng',
      content: '📣 CHÚNG TÔI ĐANG TUYỂN DỤNG! 📣\n\nBạn đam mê và muốn tham gia vào đội ngũ của chúng tôi? Gửi CV ngay hôm nay!\n\n#tuyendung #vieclam #hiring',
      userId: user.id,
    },
  })

  console.log('Created templates.')

  // Seed Scheduled Posts
  const now = new Date()
  await prisma.post.create({
    data: {
      pageId: page1.id,
      content: 'Bài viết được lên lịch cho ngày mai. Hẹn gặp lại các bạn!',
      status: PostStatus.SCHEDULED,
      scheduledAt: add(now, { days: 1, hours: 2 }),
      images: {
        create: [
          { url: 'https://picsum.photos/800/600?random=3' },
        ]
      }
    },
  })

  await prisma.post.create({
    data: {
      pageId: page2.id,
      content: 'Đừng quên ưu đãi đặc biệt sẽ diễn ra trong 2 ngày tới!',
      status: PostStatus.SCHEDULED,
      scheduledAt: add(now, { days: 2, hours: 5 }),
    },
  })

  console.log('Created scheduled posts.')
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    // FIX: Replaced process.exit(1) with process.exitCode = 1.
    // This resolves the TypeScript error and ensures the .finally() block runs to disconnect prisma.
    // Cast to any to fix TypeScript error due to missing Node.js types.
    (process as any).exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect()
  })