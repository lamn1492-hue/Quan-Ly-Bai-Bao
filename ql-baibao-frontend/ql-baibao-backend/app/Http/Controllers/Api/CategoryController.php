<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Category;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::all(), 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
        ]);

        try {
            $category = new Category();
            $category->name = $request->name;
            $category->save();

            return response()->json([
                'message' => 'Thêm danh mục thành công!',
                'category' => $category
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi thêm lĩnh vực: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $category = Category::findOrFail($id);
            $category->delete();
            return response()->json(['message' => 'Xóa danh mục thành công!'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi khi xóa: ' . $e->getMessage()], 500);
        }
    }
}