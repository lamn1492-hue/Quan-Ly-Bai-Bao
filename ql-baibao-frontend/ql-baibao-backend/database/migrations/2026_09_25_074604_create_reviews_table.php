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
     Schema::create('reviews', function (Blueprint $table) {
         $table->id();
         $table->unsignedBigInteger('article_id'); // Bài báo nào?
         $table->unsignedBigInteger('reviewer_id'); // Ai duyệt?

         $table->text('comments')->nullable(); // Nhận xét của người duyệt
         $table->string('decision')->nullable(); // Quyết định: accept, minor_revision, major_revision, reject
         $table->string('status')->default('pending'); // Trạng thái chấm: pending (đang chấm), submitted (đã nộp kết quả)
         $table->date('deadline')->nullable(); // Hạn chót chấm bài

         $table->timestamps();

         // Khóa ngoại liên kết dữ liệu
         $table->foreign('article_id')->references('id')->on('articles')->onDelete('cascade');
         $table->foreign('reviewer_id')->references('id')->on('users')->onDelete('cascade');
     });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
