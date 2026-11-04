<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    // 1. Cho phép Laravel lưu dữ liệu vào các cột này
    protected $fillable = [
        'article_id',
        'user_id',
        'parent_id',
        'content' ,
        'attachment'
    ];

    // 2. Mối quan hệ: Một bình luận thuộc về một Người dùng (Tác giả bình luận)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // 3. Mối quan hệ: Một bình luận thuộc về một Bài báo
    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    // 4. Mối quan hệ: Một bình luận có thể có nhiều Phản hồi (reply)
    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }
}