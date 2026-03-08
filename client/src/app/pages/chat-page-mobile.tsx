import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Info,
  Send,
  Paperclip,
  Check,
  CheckCheck,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

// Mock guide data
const guideData = {
  id: "1",
  name: "Ahmed Hassan",
  avatar: "https://images.unsplash.com/photo-1659100939687-a7c10b4d5841?w=400",
  isOnline: true,
};

// Mock chat messages
const initialMessages = [
  {
    id: "1",
    senderId: "guide",
    senderName: "Ahmed Hassan",
    text: "Hello! Thanks for reaching out. I'd be happy to help you plan your Aswan adventure!",
    timestamp: "Yesterday, 3:45 PM",
    status: "read" as const,
    date: "Yesterday",
  },
  {
    id: "2",
    senderId: "traveler",
    senderName: "You",
    text: "Hi Ahmed! I'm visiting Aswan next month and interested in a full-day tour. What would you recommend?",
    timestamp: "Yesterday, 3:47 PM",
    status: "read" as const,
    date: "Yesterday",
  },
  {
    id: "3",
    senderId: "guide",
    senderName: "Ahmed Hassan",
    text: "Perfect timing! I'd suggest visiting Abu Simbel early morning, then Philae Temple in the afternoon. We can also include a traditional Nubian village experience.",
    timestamp: "Yesterday, 3:50 PM",
    status: "read" as const,
    date: "Yesterday",
  },
  {
    id: "4",
    senderId: "traveler",
    senderName: "You",
    text: "That sounds amazing! How long is the drive to Abu Simbel?",
    timestamp: "Yesterday, 3:52 PM",
    status: "read" as const,
    date: "Yesterday",
  },
  {
    id: "5",
    senderId: "guide",
    senderName: "Ahmed Hassan",
    text: "It's about 3 hours each way, but the sunrise at Abu Simbel is absolutely worth it. The temples are stunning when the first light hits them!",
    timestamp: "Today, 9:15 AM",
    status: "read" as const,
    date: "Today",
  },
  {
    id: "6",
    senderId: "traveler",
    senderName: "You",
    text: "Perfect! What's the total cost for this tour?",
    timestamp: "Today, 9:18 AM",
    status: "delivered" as const,
    date: "Today",
  },
];

export function ChatPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "reconnecting"
  >("connected");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Simulate typing indicator
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].senderId === "traveler") {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          // Simulate guide response
          const responses = [
            "For a full-day tour including Abu Simbel, Philae Temple, and the Nubian village, it's $280 per person. This includes all entrance fees, transportation, lunch, and my guiding services!",
            "I can arrange everything for you. When would you like to book?",
            "Let me check my availability for next month.",
          ];
          const randomResponse =
            responses[Math.floor(Math.random() * responses.length)];
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              senderId: "guide",
              senderName: "Ahmed Hassan",
              text: randomResponse,
              timestamp: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              }),
              status: "sent" as const,
              date: "Today",
            },
          ]);
        }, 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const handleBack = () => {
    navigate(`/marketplace/guides/${roomId}`);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        senderId: "traveler",
        senderName: "You",
        text: inputText,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        status: "sent" as const,
        date: "Today",
      };
      setMessages([...messages, newMessage]);
      setInputText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  messages.forEach((msg) => {
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === msg.date) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: msg.date, messages: [msg] });
    }
  });

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Mobile container - iPhone 14 size */}
      <div className="mx-auto max-w-[390px] bg-white min-h-screen flex flex-col h-screen max-h-[844px]">
        {/* Connection Status Bar */}
        <AnimatePresence>
          {connectionStatus === "reconnecting" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-500 text-white text-center py-1 text-[12px] font-medium"
            >
              Reconnecting...
            </motion.div>
          )}
          {connectionStatus === "connected" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-500 text-white text-center py-1 text-[12px] font-medium"
            >
              Connected
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <ImageWithFallback
                    src={guideData.avatar}
                    alt={guideData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {guideData.isOnline && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold text-gray-900 truncate">
                  {guideData.name}
                </h2>
                <p className="text-[12px] text-gray-500">
                  {guideData.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Info className="w-5 h-5 text-gray-700" />
          </button>
        </motion.header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date Separator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="flex items-center justify-center mb-4"
              >
                <div className="bg-gray-200 text-gray-600 text-[11px] px-3 py-1 rounded-full font-medium">
                  {group.date}
                </div>
              </motion.div>

              {/* Messages */}
              {group.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                >
                  <MessageBubble message={message} />
                </motion.div>
              ))}
            </div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="flex items-end gap-2"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={guideData.avatar}
                    alt={guideData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: 0,
                      }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: 0.2,
                      }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: 0.4,
                      }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-t border-gray-200 px-4 py-3 bg-white"
        >
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full bg-gray-100 rounded-full px-4 py-2.5 text-[14px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D7377]/20"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-full transition-all ${
                inputText.trim()
                  ? "bg-[#0D7377] text-white shadow-lg shadow-[#0D7377]/30"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
}: {
  message: {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
    status: "sent" | "delivered" | "read";
  };
}) {
  const isTraveler = message.senderId === "traveler";

  return (
    <div
      className={`flex items-end gap-2 mb-3 ${
        isTraveler ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {!isTraveler && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1659100939687-a7c10b4d5841?w=400"
            alt="Guide"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={`flex flex-col ${isTraveler ? "items-end" : "items-start"}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`max-w-[260px] px-4 py-2.5 rounded-2xl ${
            isTraveler
              ? "bg-[#0D7377] text-white rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md"
          }`}
        >
          <p className="text-[14px] leading-relaxed">{message.text}</p>
        </motion.div>
        <div
          className={`flex items-center gap-1 mt-1 px-1 ${
            isTraveler ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-[11px] text-gray-500">{message.timestamp}</span>
          {isTraveler && (
            <div className="text-gray-500">
              {message.status === "sent" && <Check className="w-3 h-3" />}
              {message.status === "delivered" && (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              {message.status === "read" && (
                <CheckCheck className="w-3.5 h-3.5 text-[#0D7377]" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
