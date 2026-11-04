<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Review;
use App\Models\User;
use App\Models\Category;
use App\Models\Notification;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    // 1. DỮ LIỆU CHO TÁC GIẢ (AUTHOR)
    public function authorDashboard($userId)
    {
        $articles = Article::with('reviews')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($art) {
                $latestReview = Review::where('article_id', $art->id)->latest()->first();
                $art->review_comment = $latestReview ? $latestReview->comments : null;
                $art->review_decision = $latestReview ? $latestReview->decision : null;
                return $art;
            });
        
        $stats = [
            'total' => $articles->count(),
            'reviewing' => $articles->where('status', 'reviewing')->count(),
            'published' => $articles->where('status', 'published')->count(),
        ];

        return response()->json([
            'articles' => $articles,
            'stats' => $stats
        ]);
    }

    // 2. DỮ LIỆU CHO BAN BIÊN TẬP (ADMIN) - KÈM NHẬN XÉT CỦA REVIEWER
    public function adminDashboard()
    {
        $pendingArticles = Article::with('user')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();
        $reviewedArticles = Article::with(['user', 'reviews.reviewer'])
            ->whereIn('status', ['reviewing', 'accepted', 'revision', 'rejected', 'published', 'locked'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($art) {
                $latestReview = Review::where('article_id', $art->id)->latest()->first();
                $reviewerUser = $latestReview ? User::find($latestReview->reviewer_id) : null;

                $art->review_comment = $latestReview ? $latestReview->comments : null;
                $art->review_decision = $latestReview ? $latestReview->decision : null;
                $art->reviewer_name = $reviewerUser ? $reviewerUser->name : 'Chuyên gia ẩn danh'; // 👈 LẤY TÊN REVIEWER

                return $art;
            });

        $stats = [
            'total' => Article::count(),
            'published' => Article::where('status', 'published')->count(),
            'rejected' => Article::where('status', 'rejected')->count(),
            'pending' => $pendingArticles->count(),
        ];

        return response()->json([
            'pending_articles' => $pendingArticles,
            'reviewed_articles' => $reviewedArticles,
            'stats' => $stats
        ]);
    }

    // 3. DỮ LIỆU CHO NGƯỜI DUYỆT (REVIEWER)
    public function reviewerDashboard($userId)
    {
        $reviews = Review::with('article')
            ->where('reviewer_id', $userId)
            ->where('status', 'pending')
            ->get();
        
        return response()->json([
            'assigned_reviews' => $reviews
        ]);
    }

    // Lấy danh sách những người có quyền Reviewer (moderator)
    public function getReviewers()
    {
        $reviewers = User::where('role', 'moderator')->get();
        return response()->json($reviewers);
    }

    // Xử lý nút: Mời Reviewer
    public function assignReviewer(Request $request)
    {
        $existingReview = Review::where('article_id', $request->article_id)
                                ->where('reviewer_id', $request->reviewer_id)
                                ->first();

        if ($existingReview) {
            return response()->json(['message' => 'Chuyên gia này đã được mời phản biện bài báo này rồi!'], 400);
        }

        $review = Review::create([
            'article_id' => $request->article_id,
            'reviewer_id' => $request->reviewer_id,
            'deadline' => $request->deadline,
            'status' => 'pending'
        ]);

        $article = Article::find($request->article_id);
        if ($article) {
            $article->status = 'reviewing';
            $article->save();

            Notification::create([
                'user_id' => $request->reviewer_id,
                'message' => 'Bạn vừa được mời phản biện bài báo: ' . $article->title,
                'article_id' => $request->article_id,
                'is_read' => false
            ]);

            Notification::create([
                'user_id' => $article->user_id,
                'message' => 'Bài báo "'.$article->title.'" của bạn đã được chuyển cho chuyên gia thẩm định chấm điểm.',
                'article_id' => $request->article_id,
                'is_read' => false
            ]);
        }

        return response()->json(['message' => 'Giao việc thành công!']);
    }

    // Xử lý nút: Desk Reject (Từ chối thẳng)
    public function deskReject($id)
    {
        $article = Article::find($id);
        if ($article) {
            $article->status = 'rejected';
            $article->save();

            Notification::create([
                'user_id' => $article->user_id,
                'message' => 'Bài báo "' . $article->title . '" của bạn đã bị từ chối. Vui lòng kiểm tra lại nội dung.',
                'article_id' => $article->id,
                'is_read' => false
            ]);

            return response()->json(['message' => 'Đã từ chối bài báo thành công.']);
        }
        return response()->json(['message' => 'Không tìm thấy bài báo'], 404);
    }
    public function submitReview(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        $review->comments = $request->comments;
        $review->decision = $request->decision;
        $review->status = 'submitted';
        $review->save();

        $article = Article::findOrFail($review->article_id);
        if ($request->decision === 'accept') {
            $article->status = 'accepted';
        } elseif ($request->decision === 'reject') {
            $article->status = 'rejected';
        } else {
            $article->status = 'revision';
        }
        $article->save();

        if ($article->status === 'revision') {
            Notification::create([
                'user_id' => $article->user_id,
                'message' => 'Bài báo "' . $article->title . '" của bạn có yêu cầu CẦN CHỈNH SỬA từ hội đồng. Nhận xét: ' . $request->comments,
                'article_id' => $article->id,
                'is_read' => false
            ]);
        } elseif ($article->status === 'rejected') {
            Notification::create([
                'user_id' => $article->user_id,
                'message' => 'Rất tiếc, bài báo "' . $article->title . '" của bạn đã BỊ TỪ CHỐI. Nhận xét: ' . $request->comments,
                'article_id' => $article->id,
                'is_read' => false
            ]);
        }
        // =======================================================================

        // Bắn chuông thông báo cho toàn bộ tài khoản Admin
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'message' => 'Reviewer đã thẩm định bài: "' . $article->title . '". Nhận xét: ' . ($request->comments ?: 'Chấp nhận xuất bản'),
                'article_id' => $article->id,
                'is_read' => false
            ]);
        }

        return response()->json(['message' => 'Đã gửi kết quả đánh giá thành công!']);
    }

    // Xử lý nút: Xuất bản bài báo
    public function publishArticle($id)
    {
        $article = Article::find($id);
        if ($article) {
            $article->status = 'published';
            $article->published_date = now();
            $article->save();
            return response()->json(['message' => 'Tuyệt vời! Bài báo đã được xuất bản công khai.']);
        }
        return response()->json(['message' => 'Không tìm thấy bài báo'], 404);
    }

    // Khóa bài báo
    public function lockArticle($id)
    {
        $article = Article::find($id);
        if ($article) {
            $article->status = 'locked';
            $article->save();
            return response()->json(['message' => 'Đã khóa bài báo thành công!']);
        }
        return response()->json(['message' => 'Không tìm thấy bài báo'], 404);
    }

    // Lấy danh sách các bài báo ĐÃ XUẤT BẢN cho Trang chủ
    public function getPublishedArticles(Request $request)
    {
        $perPage = $request->query('per_page', 6);

        $articles = Article::with('user')
            ->whereIn('status', ['published', 'accepted'])
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage);

        return response()->json($articles);
    }

    // Lấy danh sách toàn bộ người dùng trong hệ thống
    public function getAllUsers()
    {
        $users = User::orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    // Thay đổi quyền (Role) của người dùng
    public function updateUserRole(Request $request, $id)
    {
        $user = User::find($id);
        if ($user) {
            $user->role = $request->role;
            $user->save();
            return response()->json(['message' => 'Đã cập nhật phân quyền thành công!']);
        }
        return response()->json(['message' => 'Không tìm thấy tài khoản'], 404);
    }

    // Thêm chuyên mục mới
    public function addCategory(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $category = Category::create(['name' => $request->name]);
        return response()->json(['message' => 'Đã thêm chuyên mục thành công!', 'category' => $category]);
    }

    // Xóa chuyên mục
    public function deleteCategory($id)
    {
        Category::destroy($id);
        return response()->json(['message' => 'Đã xóa chuyên mục thành công!']);
    }

    // Cập nhật hồ sơ cá nhân
    public function updateProfile(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['message' => 'Không tìm thấy tài khoản'], 404);

        $user->name = $request->name;
        if ($request->password) {
            $user->password = bcrypt($request->password);
        }
        $user->save();

        return response()->json(['message' => 'Cập nhật hồ sơ thành công!', 'user' => $user]);
    }
}