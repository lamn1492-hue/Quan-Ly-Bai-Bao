<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Article::insert([
            [
                'title' => 'Nghiên cứu ứng dụng công nghệ trong quản lý dữ liệu',
                'author' => 'Nguyễn Văn A',
                'abstract' => 'Bài báo trình bày về việc áp dụng công nghệ phần mềm để tối ưu hóa quy trình quản lý và nâng cao hiệu suất lưu trữ.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Phát triển nền tảng giao dịch trực tuyến',
                'author' => 'Trần Thị B',
                'abstract' => 'Đánh giá các mô hình kiến trúc phần mềm hiện đại trong việc xây dựng các nền tảng quản lý chịu tải cao.',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
