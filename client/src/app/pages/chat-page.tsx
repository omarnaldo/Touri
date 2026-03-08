import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Send,
  Check,
  CheckCheck,
  Search,
  MapPin,
  Star,
} from "lucide-react";
import { chatService } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { io, type Socket } from "socket.io-client";

interface Room {
  room_id: string;
  other_user_id: string;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
  role: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  status: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_image?: string;
}

function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div
      className="rounded-full bg-gradient-to-br from-[#0D4A3A] to-[#3CC9A0] flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold" style={{ fontSize: size * 0.35 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Connect to Socket.io
  useEffect(() => {
    if (!token) return;

    const socket = io(window.location.origin, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("message:new", (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Update room's last message
      setRooms((prev) =>
        prev.map((r) =>
          r.room_id === msg.room_id
            ? { ...r, last_message: msg.message, last_message_time: msg.created_at }
            : r
        )
      );
    });

    socket.on("messages:read", ({ roomId }: { roomId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.room_id === roomId ? { ...m, is_read: true, status: "read" } : m))
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Load rooms
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await chatService.getRooms();
        setRooms(data);

        // If navigated from marketplace with a roomId, select that room
        const state = location.state as { roomId?: string } | null;
        if (state?.roomId) {
          const room = data.find((r: Room) => r.room_id === state.roomId);
          if (room) setSelectedRoom(room);
        }
      } catch (error) {
        console.error("Failed to load rooms:", error);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    loadRooms();
  }, []);

  // Load messages when room is selected
  useEffect(() => {
    if (!selectedRoom) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const data = await chatService.getMessages(selectedRoom.room_id);
        setMessages(data.data);

        // Join Socket.io room
        socketRef.current?.emit("room:join", selectedRoom.room_id);

        // Mark messages as read
        await chatService.markAsRead(selectedRoom.room_id);
        setRooms((prev) =>
          prev.map((r) => (r.room_id === selectedRoom.room_id ? { ...r, unread_count: 0 } : r))
        );
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();

    return () => {
      socketRef.current?.emit("room:leave", selectedRoom.room_id);
    };
  }, [selectedRoom?.room_id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedRoom) return;

    // Send via Socket.io for real-time delivery
    socketRef.current?.emit("message:send", {
      roomId: selectedRoom.room_id,
      message: newMessage.trim(),
    });

    setNewMessage("");
  };

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const name = `${room.first_name} ${room.last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-screen flex bg-[#FDF3E7]">
      {/* Sidebar */}
      <div
        className={`w-full md:w-96 bg-white border-r border-gray-100 flex flex-col ${
          selectedRoom ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#0A1628]" />
              </button>
              <h1 className="text-2xl font-bold text-[#0D4A3A]">Messages</h1>
            </div>
            {user && (
              <Avatar
                name={`${user.firstName ?? ""} ${user.lastName ?? ""}`}
                src={user.profileImageUrl ?? undefined}
                size={36}
              />
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A1628]/40" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F9FA] text-sm focus:outline-none focus:ring-2 focus:ring-[#3CC9A0]/30"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingRooms ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#3CC9A0] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-[#0A1628]/60 text-sm">
                {rooms.length === 0
                  ? "No conversations yet. Contact a guide from the marketplace to start chatting!"
                  : "No conversations match your search"}
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <motion.div
                key={room.room_id}
                whileHover={{ backgroundColor: "#F8F9FA" }}
                onClick={() => setSelectedRoom(room)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-50 transition-colors ${
                  selectedRoom?.room_id === room.room_id ? "bg-[#E8F5F1]" : ""
                }`}
              >
                <Avatar
                  name={`${room.first_name} ${room.last_name}`}
                  src={room.profile_image_url}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0A1628] text-sm">
                      {room.first_name} {room.last_name}
                    </span>
                    {room.last_message_time && (
                      <span className="text-xs text-[#0A1628]/40">
                        {formatTime(room.last_message_time)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-[#0A1628]/60 truncate">
                      {room.last_message || "No messages yet"}
                    </p>
                    {room.unread_count > 0 && (
                      <span className="bg-[#3CC9A0] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          !selectedRoom ? "hidden md:flex" : "flex"
        }`}
      >
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-[#0D4A3A] mb-2">Select a conversation</h2>
              <p className="text-[#0A1628]/60">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedRoom(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar
                name={`${selectedRoom.first_name} ${selectedRoom.last_name}`}
                src={selectedRoom.profile_image_url}
              />
              <div>
                <h3 className="font-bold text-[#0A1628]">
                  {selectedRoom.first_name} {selectedRoom.last_name}
                </h3>
                <span className="text-xs text-[#0A1628]/60 capitalize">{selectedRoom.role}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-[#FDF3E7] to-white">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-[#3CC9A0] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[#0A1628]/60">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isOwn
                            ? "bg-[#0D4A3A] text-white rounded-br-md"
                            : "bg-white text-[#0A1628] shadow-sm rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className={`text-xs ${isOwn ? "text-white/60" : "text-[#0A1628]/40"}`}>
                            {formatTime(msg.created_at)}
                          </span>
                          {isOwn && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-[#3CC9A0]" />
                            ) : (
                              <Check className="w-3 h-3 text-white/60" />
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-[#3CC9A0]/30 text-[#0A1628]"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className={`p-3 rounded-xl transition-all ${
                    newMessage.trim()
                      ? "bg-[#0D4A3A] text-white shadow-lg hover:shadow-xl"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}