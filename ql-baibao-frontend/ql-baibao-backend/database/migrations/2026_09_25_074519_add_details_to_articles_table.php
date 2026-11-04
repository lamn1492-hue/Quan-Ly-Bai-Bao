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
        Schema::table('articles', function (Blueprint $table) {
            // Kiểm tra xem cột abstract đã có chưa, chưa có thì mới tạo
            if (!Schema::hasColumn('articles', 'abstract')) {
                $table->text('abstract')->nullable();
            }
            
            // Kiểm tra cột status
            if (!Schema::hasColumn('articles', 'status')) {
                $table->string('status')->default('pending');
            }
            
            // Kiểm tra cột user_id
            if (!Schema::hasColumn('articles', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable();
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            //
        });
    }
};
