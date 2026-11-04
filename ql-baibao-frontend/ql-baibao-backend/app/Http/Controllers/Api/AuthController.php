<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // HÀM ĐĂNG KÝ
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'nullable|in:user,moderator,admin',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'user',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    // HÀM ĐĂNG NHẬP
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Sai email hoặc mật khẩu'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }
    // HÀM CẬP NHẬT THÔNG TIN
    // HÀM CẬP NHẬT THÔNG TIN VÀ MẬT KHẨU
    public function updateProfile(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng'], 404);
        }

        // Cập nhật thông tin cơ bản
        $user->name = $request->name;
        $user->email = $request->email;
        $user->phone = $request->phone; 
        $user->bio = $request->bio ?? $user->bio;
        $user->phone = $request->phone ?? $user->phone;
        // Xử lý đổi mật khẩu
        if ($request->filled('new_password')) {
            
            // LOGIC MỚI: Nếu tài khoản liên kết Google VÀ người dùng bỏ trống ô mật khẩu cũ
            if ($user->google_id && !$request->filled('current_password')) {
                // Bỏ qua bước kiểm tra mật khẩu cũ, cho phép đổi trực tiếp
            } else {
                // Kiểm tra mật khẩu cũ thông thường đối với tài khoản đăng ký tay
                if (!Hash::check($request->current_password, $user->password)) {
                    return response()->json(['message' => 'Mật khẩu hiện tại không đúng!'], 400);
                }
            }
            
            // Mã hóa và lưu mật khẩu mới
            $user->password = Hash::make($request->new_password);
        }

        $user->save();

        return response()->json(['user' => $user]);
    }

    // LẤY DANH SÁCH NGƯỜI DÙNG
    public function getAuthors()
    {
        $authors = \App\Models\User::withCount(['articles' => function ($query) {
            $query->where('status', 'published');
        }])
        ->orderBy('articles_count', 'desc')
        ->get();

        return response()->json($authors);
    }

    // CẬP NHẬT QUYỀN (ROLE)
    public function updateRole(Request $request, $id)
    {
        $user = \App\Models\User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng'], 404);
        }
        $user->role = $request->role;
        $user->save();
        return response()->json(['message' => 'Cập nhật phân quyền thành công!']);
    }
    // XỬ LÝ ĐĂNG NHẬP/ĐĂNG KÝ BẰNG GOOGLE
    public function googleLogin(Request $request)
    {
        $user = \App\Models\User::where('email', $request->email)->first();

        if ($user) {
            $user->google_id = $request->google_id;
            $user->save();
        } else {
            $user = \App\Models\User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => \Illuminate\Support\Facades\Hash::make(uniqid()),
                'google_id' => $request->google_id,
                'role' => 'user'
            ]);
        }
        return response()->json(['user' => $user]);
    }

    // XỬ LÝ QUÊN MẬT KHẨU (Cấp lại mật khẩu mới trực tiếp)
    public function forgotPassword(Request $request)
    {
        $user = \App\Models\User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Email này chưa được đăng ký trong hệ thống!'], 404);
        }

        $newPassword = substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6);
        $user->password = \Illuminate\Support\Facades\Hash::make($newPassword);
        $user->save();

        return response()->json(['message' => 'Thành công! Mật khẩu mới của bạn là: ' . $newPassword]);
    }

    public function updatePersonalPage(Request $request, $id) {
        $user = User::findOrFail($id);

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $avatarPath = $file->store('avatars', 'public');
            $user->avatar = $avatarPath;
        }

        $user->bio = $request->bio ?? $user->bio;
        $user->location = $request->location ?? $user->location;
        $user->school = $request->school ?? $user->school;
        $user->phone = $request->phone ?? $user->phone;

        if ($request->name) {
            $user->name = $request->name;
        }

        $user->save();
        return response()->json(['message' => 'Đã cập nhật', 'user' => $user]);
    }
}