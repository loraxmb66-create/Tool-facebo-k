
# Công Cụ Quản Lý Fanpage Facebook

Đây là một ứng dụng web full-stack được xây dựng bằng Next.js, cho phép bạn quản lý các Fanpage Facebook của mình. Các tính năng chính bao gồm:

-   **Xác thực an toàn:** Đăng nhập bằng tài khoản Facebook của bạn thông qua OAuth 2.0.
-   **Quản lý bài đăng:** Tạo, xem trước và đăng bài viết có chứa văn bản và nhiều hình ảnh.
-   **Watermark tự động:** Tự động thêm watermark vào tất cả các ảnh được tải lên.
-   **Lên lịch bài đăng:** Lên lịch đăng bài vào bất kỳ thời điểm nào trong tương lai (múi giờ `Asia/Phnom_Penh`).
-   **Lịch nội dung:** Xem tất cả các bài đã lên lịch và đã đăng trên giao diện lịch trực quan.
-   **Lịch sử và Logs:** Theo dõi trạng thái của tất cả các bài đăng (đã đăng, đã lên lịch, nháp, thất bại).
-   **Bản nháp & Mẫu:** Lưu bài viết dưới dạng bản nháp hoặc tạo các mẫu để tái sử dụng nhanh chóng.

## Yêu Cầu

-   Node.js (phiên bản 18.x trở lên)
-   npm hoặc yarn
-   Tài khoản nhà phát triển Facebook
-   Một file ảnh tên `watermark.png` đặt trong thư mục `/public` để làm watermark.

## 1. Thiết Lập Ứng Dụng Facebook

Trước khi chạy ứng dụng, bạn cần tạo một ứng dụng trên Meta for Developers.

1.  **Tạo Ứng Dụng Mới:**
    -   Truy cập [Meta for Developers](https://developers.facebook.com/).
    -   Nhấp vào "My Apps" -> "Create App".
    -   Chọn loại ứng dụng là "Business".
    -   Điền tên ứng dụng và email liên hệ của bạn.

2.  **Cấu Hình Đăng Nhập Facebook (Facebook Login):**
    -   Trong bảng điều khiển ứng dụng, tìm sản phẩm "Facebook Login" và nhấp vào "Set up".
    -   Chọn "Web".
    -   Trong mục "Site URL", nhập `http://localhost:3000`.

3.  **Thiết Lập OAuth Redirect URI:**
    -   Trong menu bên trái, vào "Facebook Login" -> "Settings".
    -   Trong phần "Valid OAuth Redirect URIs", thêm URL sau:
        ```
        http://localhost:3000/api/auth/callback/facebook
        ```
    -   Lưu các thay đổi.

4.  **Lấy App ID và App Secret:**
    -   Vào "App Settings" -> "Basic".
    -   Bạn sẽ thấy `App ID` và `App Secret` của mình. Bạn sẽ cần chúng cho các biến môi trường.

5.  **Xin Quyền (Permissions):**
    -   Vào "App Review" -> "Permissions and Features".
    -   Tìm và yêu cầu quyền truy cập "Advanced Access" cho các quyền sau:
        -   `pages_show_list`
        -   `pages_manage_posts`
        -   `pages_read_engagement`
        -   `business_management`
    -   Trong quá trình phát triển, bạn có thể sử dụng quyền truy cập cơ bản mà không cần gửi ứng dụng để xét duyệt.

## 2. Cài Đặt Dự Án

1.  **Sao chép mã nguồn.**

2.  **Tạo file môi trường:**
    Tạo một file tên là `.env.local` ở thư mục gốc của dự án và điền các giá trị của bạn:

    ```bash
    # .env.local
    
    # Prisma - Đường dẫn tới file database SQLite
    DATABASE_URL="file:./dev.db"
    
    # NextAuth.js
    # Bạn có thể tạo một secret bằng lệnh: openssl rand -base64 32
    # Hoặc truy cập https://generate-secret.vercel.app/32
    NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
    NEXTAUTH_URL="http://localhost:3000"
    
    # Facebook OAuth Provider
    FACEBOOK_CLIENT_ID="YOUR_FACEBOOK_APP_ID"
    FACEBOOK_CLIENT_SECRET="YOUR_FACEBOOK_APP_SECRET"
    ```

3.  **Cài đặt các gói phụ thuộc:**
    ```bash
    npm install
    ```

4.  **Thiết lập và Seed cơ sở dữ liệu:**
    Chạy các lệnh sau để khởi tạo cơ sở dữ liệu SQLite và điền dữ liệu mẫu (2 trang giả, 3 mẫu, 2 lịch đăng).
    ```bash
    npx prisma migrate dev --name init
    npx prisma db seed
    ```
    
5.  **Thêm file Watermark:**
    Đặt một file ảnh tên là `watermark.png` vào thư mục `public`. File này sẽ được tự động thêm vào các ảnh bạn tải lên.

## 3. Chạy Ứng Dụng

1.  **Chạy máy chủ phát triển (Development):**
    ```bash
    npm run dev
    ```
    Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt của bạn.

2.  **Build cho Production:**
    ```bash
    npm run build
    ```

3.  **Chạy ứng dụng Production:**
    ```bash
    npm run start
    ```

## Cấu Trúc Dự Án

-   `/app`: Chứa các trang và API routes theo App Router của Next.js.
-   `/components`: Chứa các component React tái sử dụng.
-   `/lib`: Chứa các hàm tiện ích, cấu hình auth, và client Prisma.
-   `/prisma`: Chứa schema cơ sở dữ liệu, file migration, và script seed.
-   `/public`: Chứa các tài sản tĩnh như ảnh (ví dụ: `watermark.png`).
-   `/actions`: Chứa các Server Actions để tương tác với server.

## Lưu Ý Quan Trọng

-   **Watermark:** Đặt file `watermark.png` của bạn trong thư mục `/public`. Ứng dụng sẽ tự động áp dụng nó lên các ảnh tải lên.
-   **Múi giờ:** Tất cả thời gian lên lịch được xử lý theo múi giờ `Asia/Phnom_Penh`.
-   **Bảo mật:** Toàn bộ logic tương tác với Facebook Graph API và access token đều được xử lý ở phía máy chủ (server-side) để đảm bảo an toàn. Client không bao giờ thấy hoặc lưu trữ các token nhạy cảm.
