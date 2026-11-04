<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class ChatController extends Controller
{
    public function getUsers($currentUserId) {
        return response()->json(User::where('id', '!=', $currentUserId)->get());
    }

    public function getMessages($user1, $user2) {
        $messages = DB::table('messages')
            ->where(function($q) use ($user1, $user2) {
                $q->where('sender_id', $user1)->where('receiver_id', $user2);
            })
            ->orWhere(function($q) use ($user1, $user2) {
                $q->where('sender_id', $user2)->where('receiver_id', $user1);
            })
            ->orderBy('created_at', 'asc')->get();
            
        return response()->json($messages);
    }

    public function sendMessage(Request $request) {
        $filePath = null;
        $fileName = null;
        $fileType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $fileType = $file->getClientMimeType();
            $filePath = $file->store('chat_files', 'public'); 
        }

        $content = $request->input('content', '');

        $messageId = DB::table('messages')->insertGetId([
            'sender_id' => $request->sender_id,
            'receiver_id' => $request->receiver_id,
            'content' => $content,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_type' => $fileType,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $newMessage = DB::table('messages')->where('id', $messageId)->first();
        $newMessageArray = (array) $newMessage;       
        $sender = User::find($request->sender_id);
        $senderName = $sender ? $sender->name : 'Một người dùng';
        $shortContent = $filePath ? 'Đã gửi một tệp đính kèm 📎' : (mb_substr($content, 0, 30) . (mb_strlen($content) > 30 ? '...' : ''));
        
        DB::table('notifications')->insert([
            'user_id' => $request->receiver_id,
            'message' => "Tin nhắn mới từ {$senderName}: \"{$shortContent}\"|||SENDER:{$request->sender_id}",
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        broadcast(new \App\Events\MessageSent($newMessageArray))->toOthers();
        
        return response()->json(['message' => 'Đã gửi']);
    }

    public function getNotifications($userId) {
        $notifications = DB::table('notifications')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($notifications);
    }

    public function markNotificationsAsRead($userId) {
        DB::table('notifications')
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
            
        return response()->json(['message' => 'Đã cập nhật trạng thái']);
    }

    public function markChatAsRead($userId, $senderId) {
        DB::table('notifications')
            ->where('user_id', $userId)
            ->where('message', 'LIKE', '%|||SENDER:' . $senderId . '%')
            ->update(['is_read' => true]);
            
        return response()->json(['message' => 'Đã đọc']);
    }
}