<?php
namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Article;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    public function index($article_id)
    {
        $comments = Comment::with(['user', 'replies.user'])
            ->where('article_id', $article_id)
            ->whereNull('parent_id')
            ->latest()
            ->get()
            ->map(function($cmt) {
                return [
                    'id' => $cmt->id,
                    'author' => $cmt->user->name ?? 'Khuyết danh',
                    'avatar' => $cmt->user->avatar ? 'http://127.0.0.1:8000/storage/'.$cmt->user->avatar : 'https://ui-avatars.com/api/?name='.urlencode($cmt->user->name ?? 'K').'&background=579799&color=fff',
                    'text' => $cmt->content,
                    'attachment' => $cmt->attachment ? 'http://127.0.0.1:8000/storage/'.$cmt->attachment : null, 
                    'time' => $cmt->created_at->diffForHumans(),
                    'replies' => $cmt->replies->map(function($reply) {
                        return [
                            'id' => $reply->id,
                            'author' => $reply->user->name ?? 'Khuyết danh',
                            'avatar' => $reply->user->avatar ? 'http://127.0.0.1:8000/storage/'.$reply->user->avatar : 'https://ui-avatars.com/api/?name='.urlencode($reply->user->name ?? 'K').'&background=579799&color=fff',
                            'text' => $reply->content,
                            'attachment' => $reply->attachment ? 'http://127.0.0.1:8000/storage/'.$reply->attachment : null,
                            'time' => $reply->created_at->diffForHumans(),
                        ];
                    })
                ];
            });
        return response()->json($comments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'article_id' => 'required|exists:articles,id',
            'user_id' => 'required|exists:users,id',
            'content' => 'nullable|string',
            'parent_id' => 'nullable|exists:comments,id',
            'attachment' => 'nullable|file|max:20480'
        ]);

        $data = $request->only(['article_id', 'user_id', 'content', 'parent_id']);
        
        // NẾU CÓ FILE GỬI LÊN THÌ LƯU VÀO THƯ MỤC STORAGE
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('comments_media', 'public');
            $data['attachment'] = $path;
        }

        $comment = Comment::create($data);
        $commenterName = User::find($request->user_id)->name;

        // Bắn thông báo
        if ($request->filled('parent_id')) {
            $parentComment = Comment::find($request->parent_id);
            if ($parentComment && $parentComment->user_id !== $request->user_id) {
                DB::table('notifications')->insert([
                    'user_id' => $parentComment->user_id,
                    'article_id' => $request->article_id,
                    'message' => "{$commenterName} đã trả lời bình luận của bạn.",
                    'is_read' => 0,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        } else {
            $article = Article::find($request->article_id);
            if ($article && $article->user_id !== $request->user_id) {
                DB::table('notifications')->insert([
                    'user_id' => $article->user_id,
                    'article_id' => $article->id,
                    'message' => "{$commenterName} đã bình luận bài viết của bạn.",
                    'is_read' => 0,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
        return response()->json(['message' => 'Thành công']);
    }

    public function destroy($id)
    {
        Comment::destroy($id);
        return response()->json(['message' => 'Đã xóa']);
    }

    public function getUserNotifications($user_id)
    {
        $notifs = DB::table('notifications')->where('user_id', $user_id)->orderBy('id', 'desc')->get();
        return response()->json($notifs);
    }

    public function markNotificationRead($id)
    {
        DB::table('notifications')->where('id', $id)->update(['is_read' => 1]);
        return response()->json(['message' => 'Đã đọc']);
    }
}