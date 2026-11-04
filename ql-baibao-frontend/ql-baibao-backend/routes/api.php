<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\ArticleController;
use App\Models\Category;
use App\Http\Controllers\CommentController;
use App\Models\Article;
use App\Models\User;
use App\Http\Controllers\Api\CategoryController;

try {
    Article::created(function ($article) {
        try {
            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                if ($admin->id !== $article->user_id) {
                    DB::table('notifications')->insert([
                        'user_id'    => $admin->id,
                        'article_id' => $article->id,
                        'message'    => "📝 Bài nộp mới: \"{$article->title}\" đang chờ Ban biên tập xét duyệt.",
                        'is_read'    => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        } catch (\Throwable $e) {}
    });
    Article::updated(function ($article) {
        try {
            if ($article->isDirty('status') && $article->user_id) {
                $status = $article->status;
                $msg = null;

                if ($status === 'published' || $status === 'approved') {
                    $msg = "🎉 Chúc mừng! Bài báo \"{$article->title}\" của bạn đã được duyệt và xuất bản.";
                } elseif ($status === 'rejected') {
                    $msg = "⚠️ Bài báo \"{$article->title}\" đã bị từ chối. Vui lòng kiểm tra phản hồi từ hội đồng.";
                } elseif ($status === 'revision_required') {
                    $msg = "⚠️ Bài báo \"{$article->title}\" có yêu cầu chỉnh sửa bổ sung từ người phản biện.";
                } elseif ($status === 'under_review' || $status === 'reviewing') {
                    $msg = "🔍 Bài báo \"{$article->title}\" của bạn đã được chuyển cho người phản biện chấm điểm.";
                }

                if ($msg) {
                    DB::table('notifications')->insert([
                        'user_id'    => $article->user_id,
                        'article_id' => $article->id,
                        'message'    => $msg,
                        'is_read'    => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        } catch (\Throwable $e) {}
    });
} catch (\Throwable $e) {}


// =======================================================================
// 1. CÁC API XÁC THỰC VÀ TÀI KHOẢN
// =======================================================================
Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
Route::post('/google-login', [\App\Http\Controllers\Api\AuthController::class, 'googleLogin']);

Route::post('/forgot-password', [\App\Http\Controllers\Api\AuthController::class, 'forgotPassword']);
Route::put('/users/{id}', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
Route::get('/users', [\App\Http\Controllers\Api\AuthController::class, 'index']);
Route::put('/users/{id}/role', [\App\Http\Controllers\Api\AuthController::class, 'updateRole']);    

// =======================================================================
// 2. API QUẢN LÝ BÀI BÁO
// =======================================================================
Route::apiResource('articles', ArticleController::class);

// =======================================================================
// 3. API LẤY THÔNG TIN USER HIỆN TẠI (Sanctum)
// =======================================================================
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// =======================================================================
// 4. API QUẢN LÝ DANH MỤC / LĨNH VỰC (Đầy đủ Xem, Thêm, Sửa tên, Xóa)
// =======================================================================
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/{id}', function (Request $request, $id) {
    $category = Category::findOrFail($id);
    $category->name = $request->input('name', $category->name);
    $category->save();
    return response()->json($category);
});
Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

// =======================================================================
// 5. CÁC ĐƯỜNG DẪN CHO WORKSPACE (TỔNG TRẠM)
// =======================================================================
Route::get('/workspace/author/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'authorDashboard']);
Route::get('/workspace/admin', [\App\Http\Controllers\Api\WorkspaceController::class, 'adminDashboard']);
Route::get('/workspace/reviewer/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'reviewerDashboard']);

Route::get('/reviewers', [\App\Http\Controllers\Api\WorkspaceController::class, 'getReviewers']);
Route::post('/workspace/assign-reviewer', [\App\Http\Controllers\Api\WorkspaceController::class, 'assignReviewer']);
Route::put('/workspace/desk-reject/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'deskReject']);

Route::put('/workspace/submit-review/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'submitReview']);
Route::put('/workspace/publish/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'publishArticle']);
Route::get('/workspace/published-articles', function (Request $request) {
    $perPage = $request->query('per_page', 6);

    $articles = Article::with('user')
        ->whereIn('status', ['published', 'accepted'])
        ->orderBy('updated_at', 'desc')
        ->paginate($perPage);

    return response()->json($articles);
});

Route::get('/workspace/users', [\App\Http\Controllers\Api\WorkspaceController::class, 'getAllUsers']);
Route::put('/workspace/users/{id}/role', [\App\Http\Controllers\Api\WorkspaceController::class, 'updateUserRole']);
Route::post('/workspace/categories', [\App\Http\Controllers\Api\WorkspaceController::class, 'addCategory']);
Route::delete('/workspace/categories/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'deleteCategory']);
Route::put('/workspace/profile/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'updateProfile']);

// =======================================================================
// 6. CHAT, BÌNH LUẬN & THÔNG BÁO (NOTIFICATIONS)
// =======================================================================
Route::get('/chat/users/{id}', [\App\Http\Controllers\Api\ChatController::class, 'getUsers']);
Route::get('/chat/messages/{u1}/{u2}', [\App\Http\Controllers\Api\ChatController::class, 'getMessages']);
Route::post('/chat/send', [\App\Http\Controllers\Api\ChatController::class, 'sendMessage']);
Route::put('/chat/read/{userId}/{senderId}', [\App\Http\Controllers\Api\ChatController::class, 'markChatAsRead']);

Route::post('/comments', [CommentController::class, 'store']);
Route::get('/articles/{article_id}/comments', [CommentController::class, 'index']);
Route::delete('/comments/{id}', [CommentController::class, 'destroy']);

Route::get('/notifications/{id}', [\App\Http\Controllers\Api\ChatController::class, 'getNotifications']);
Route::get('/users/{user_id}/notifications', [CommentController::class, 'getUserNotifications']);
Route::put('/notifications/{id}/read', [CommentController::class, 'markNotificationRead']);

Route::post('/articles/{id}/view', function($id) {
    $article = Article::find($id);
    if ($article) {
        $article->increment('views');
        return response()->json(['message' => 'OK', 'views' => $article->views]);
    }
    return response()->json(['message' => 'Lỗi'], 404);
});
Route::post('/users/{id}/personal-page', [\App\Http\Controllers\Api\AuthController::class, 'updatePersonalPage']);
Route::put('/workspace/lock/{id}', function ($id) {
    $article = \App\Models\Article::findOrFail($id);
    $article->status = 'locked';
    $article->save();

    try {
        if ($article->user_id) {
            DB::table('notifications')->insert([
                'user_id'    => $article->user_id,
                'article_id' => $article->id,
                'message'    => "⚠️ Bài báo \"{$article->title}\" của bạn đã bị Quản trị viên tạm khóa khỏi Trang chủ.",
                'is_read'    => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    } catch (\Throwable $e) {}

    return response()->json([
        'message' => 'Đã khóa bài báo và tạm ẩn khỏi Trang chủ!',
        'article' => $article
    ]);
});

Route::get('/video-stream', [ArticleController::class, 'streamVideo']);

Route::get('/authors-list', function () {
    $users = \App\Models\User::withCount(['articles as published_articles_count' => function ($query) {
        $query->where('status', 'published');
    }])
    ->orderBy('published_articles_count', 'desc')
    ->orderBy('created_at', 'desc')               
    ->get();
    
    return response()->json($users);
    });
    
