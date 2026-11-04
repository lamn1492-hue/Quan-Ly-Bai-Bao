<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $categoryId = $request->query('category_id'); 
        
        $articles = \App\Models\Article::with('category')
            ->when($search, function ($query, $search) {
                return $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('author', 'like', "%{$search}%");
                });
            })
            ->when($categoryId, function ($query, $categoryId) {
                return $query->where('category_id', $categoryId);
            })
            ->latest()
            ->paginate(4); 
        
        return response()->json($articles);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required',
        ]);

        $filePath = null;
        $imagePath = null;
        $videoPath = null;

        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('articles', 'public');
        }
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('article_media', 'public');
        }
        if ($request->hasFile('video')) {
            $videoPath = $request->file('video')->store('article_media', 'public');
        }

        if ($request->hasFile('content_images')) {
            foreach ($request->file('content_images') as $file) {
                $fileName = $file->getClientOriginalName();
                $file->storeAs('article_media', $fileName, 'public');
            }
        }
        if ($request->hasFile('content_videos')) {
            foreach ($request->file('content_videos') as $file) {
                $fileName = $file->getClientOriginalName();
                $file->storeAs('article_media', $fileName, 'public');
            }
        }
        // =======================================================

        $article = \App\Models\Article::create([
            'title' => $request->title,
            'author' => $request->author ?? 'Khuyết danh', 
            'abstract' => $request->abstract, 
            'category_id' => $request->category_id,
            'user_id' => $request->user_id, 
            'status' => 'pending', 
            'file_path' => $filePath,
            'image_path' => $imagePath,
            'video_path' => $videoPath,
        ]);

        return response()->json([
            'message' => 'Nộp bài báo thành công!',
            'article' => $article
        ], 201);
    }

    public function show(string $id)
    {
        //
    }

    public function update(Request $request, $id)
    {
        $article = \App\Models\Article::find($id);
        if (!$article) {
            return response()->json(['message' => 'Không tìm thấy bài báo'], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'abstract' => 'nullable|string',
            'file' => 'nullable|mimes:pdf,doc,docx|max:10240',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        if ($request->hasFile('file')) {
            $validated['file_path'] = $request->file('file')->store('pdfs', 'public');
        }
        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('article_media', 'public');
        }
        if ($request->hasFile('video')) {
            $validated['video_path'] = $request->file('video')->store('article_media', 'public');
        }

        // ================= GÓI NÂNG CẤP ĐA ẢNH Ở HÀM UPDATE =================
        if ($request->hasFile('content_images')) {
            foreach ($request->file('content_images') as $file) {
                $fileName = $file->getClientOriginalName();
                $file->storeAs('article_media', $fileName, 'public');
            }
        }
        if ($request->hasFile('content_videos')) {
            foreach ($request->file('content_videos') as $file) {
                $fileName = $file->getClientOriginalName();
                $file->storeAs('article_media', $fileName, 'public');
            }
        }

        // ===== LOGIC CHÍNH SỬA QUY TRÌNH NỘP LẠI BÀI =====
        if ($article->status === 'revision') {
            $validated['status'] = 'pending'; 
        }
        
        $article->update($validated);
        if (isset($validated['status']) && $validated['status'] === 'pending') {
             $admins = \App\Models\User::where('role', 'admin')->get();
             foreach ($admins as $admin) {
                 \App\Models\Notification::create([
                     'user_id' => $admin->id,
                     'message' => 'Tác giả vừa nộp lại bản chỉnh sửa cho bài báo: "' . $article->title . '".',
                     'article_id' => $article->id,
                     'is_read' => false
                 ]);
             }
        }

        return response()->json([
            'message' => 'Cập nhật bài báo thành công!',
            'article' => $article
        ]);
    }

    public function destroy($id)
    {
        $article = \App\Models\Article::find($id);
        if ($article) {
            $article->delete();
            return response()->json(['message' => 'Xóa bài báo thành công']);
        }
        return response()->json(['message' => 'Không tìm thấy bài báo'], 404);
    }

    public function streamVideo(Request $request)
    {
        $path = $request->query('path');
        if (!$path) {
            return response()->json(['message' => 'Thiếu đường dẫn video'], 400);
        }

        // Làm sạch đường dẫn để bảo mật
        $cleanPath = str_replace(['..', '\\'], ['', '/'], ltrim($path, '/'));
        if (str_starts_with($cleanPath, 'storage/')) {
            $cleanPath = substr($cleanPath, 8);
        }

        $fullPath = storage_path('app/public/' . $cleanPath);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'Không tìm thấy file video'], 404);
        }

        // Tự động kích hoạt phản hồi HTTP 206 Partial Content để tua video
        return response()->file($fullPath, [
            'Content-Type' => mime_content_type($fullPath) ?: 'video/mp4',
            'Accept-Ranges' => 'bytes',
        ]);
    }
}   