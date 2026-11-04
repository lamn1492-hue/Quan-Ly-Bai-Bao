<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewCommentNotification extends Notification
{
    use Queueable;
    protected $comment;
    protected $commenterName;
    protected $articleTitle;

    public function __construct($comment, $commenterName, $articleTitle)
    {
        $this->comment = $comment;
        $this->commenterName = $commenterName;
        $this->articleTitle = $articleTitle;
    }

    public function via($notifiable)
    {
        return ['database']; // Lưu thẳng vào bảng notifications bạn đang có
    }

    public function toDatabase($notifiable)
    {
        return [
            'article_id' => $this->comment->article_id,
            'comment_id' => $this->comment->id,
            'message' => "{$this->commenterName} đã bình luận về bài viết: {$this->articleTitle}"
        ];
    }
}