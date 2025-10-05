
import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Công Cụ Quản Lý Fanpage Facebook
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
                Tự động hóa, lên lịch và phân tích bài đăng của bạn. Tiết kiệm thời gian và phát triển Fanpage của bạn một cách hiệu quả.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
                <form
                    action={async () => {
                        "use server";
                        await signIn("facebook");
                    }}
                >
                    <Button type="submit" size="lg">
                        Đăng nhập với Facebook để bắt đầu
                    </Button>
                </form>
            </div>
        </div>
    </main>
  );
}
