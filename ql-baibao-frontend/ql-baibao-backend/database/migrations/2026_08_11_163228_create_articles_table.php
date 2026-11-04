<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // Tên bài báo
            $table->string('author'); // Tên tác giả
            $table->text('abstract')->nullable(); // Nội dung tóm tắt
            $table->date('published_date')->nullable(); // Ngày xuất bản
            $table->string('file_path')->nullable(); // Đường dẫn file PDF đính kèm
            $table->timestamps(); // Tự động tạo cột created_at và updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
