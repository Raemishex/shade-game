"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGuestUser } from "@/lib/guest";
import { useTranslation } from "@/hooks/useTranslation";

interface Friend {
  id: string;
  name: string;
  color: string;
}

interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromColor: string;
  toId: string;
  toName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export default function FriendsPage() {
  const { t } = useTranslation();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [addUserId, setAddUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const guest = getGuestUser();

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch(`/api/friends?userId=${guest.userId}`);
      const data = await res.json();
      if (data.success) {
        setFriends(data.friends);
        setIncoming(data.incoming);
        setOutgoing(data.outgoing);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [guest.userId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function handleAddFriend() {
    const trimmed = addUserId.trim();
    if (!trimmed) return;

    setActionLoading("add");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: guest.userId,
          fromName: guest.displayName,
          fromColor: guest.avatarColor,
          toId: trimmed,
          toName: t("friends.defaultName"),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: t("friends.requestSent"), type: "success" });
        setAddUserId("");
        fetchFriends();
      } else {
        setMessage({ text: data.error || t("friends.requestFailed"), type: "error" });
      }
    } catch {
      setMessage({ text: t("friends.requestFailed"), type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRequest(requestId: string, status: "accepted" | "rejected") {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/friends", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFriends();
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark px-6">
        <motion.span
          className="text-cream/60 text-lg font-nunito"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          {t("app.loading")}
        </motion.span>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-dark pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-6 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-cream font-nunito mb-1">
          {t("friends.title")}
        </h1>
        <p className="text-cream/50 text-sm font-nunito mb-5">
          {t("friends.subtitle")}
        </p>

        {/* Toast message */}
        <AnimatePresence>
          {message && (
            <motion.div
              className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-nunito ${
                message.type === "success"
                  ? "bg-green/10 border border-green/20 text-green"
                  : "bg-red/10 border border-red/20 text-red"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add friend */}
        <div className="mb-6">
          <p className="text-[10px] text-cream/50 tracking-[1.5px] uppercase mb-2">
            {t("friends.addFriend")}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddFriend();
              }}
              placeholder={t("friends.userIdPlaceholder")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream/[0.04] border border-cream/[0.08] text-cream text-sm font-nunito placeholder:text-cream/30 outline-none focus:border-gold/30 transition-colors"
            />
            <button
              onClick={handleAddFriend}
              disabled={actionLoading === "add" || !addUserId.trim()}
              className="px-4 py-2.5 rounded-xl bg-gold text-dark text-sm font-medium font-nunito hover:bg-gold/90 transition-colors disabled:opacity-40"
            >
              {actionLoading === "add" ? "..." : t("friends.send")}
            </button>
          </div>
        </div>

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-cream/50 tracking-[1.5px] uppercase mb-2.5">
              {t("friends.incomingRequests")} ({incoming.length})
            </p>
            <div className="space-y-2">
              {incoming.map((req) => (
                <motion.div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-cream/[0.03] border border-cream/[0.06]"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium text-dark shrink-0"
                    style={{ backgroundColor: req.fromColor || "#C8A44E" }}
                  >
                    {req.fromName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-cream font-nunito truncate">
                      {req.fromName}
                    </p>
                    <p className="text-[10px] text-cream/40 font-nunito">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleRequest(req.id, "accepted")}
                      disabled={actionLoading === req.id}
                      className="px-3 py-1.5 rounded-lg bg-green/10 border border-green/20 text-green text-[11px] font-medium font-nunito hover:bg-green/15 transition-colors disabled:opacity-40"
                    >
                      {actionLoading === req.id ? "..." : t("friends.accept")}
                    </button>
                    <button
                      onClick={() => handleRequest(req.id, "rejected")}
                      disabled={actionLoading === req.id}
                      className="px-3 py-1.5 rounded-lg bg-red/10 border border-red/20 text-red text-[11px] font-medium font-nunito hover:bg-red/15 transition-colors disabled:opacity-40"
                    >
                      {t("friends.reject")}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing requests */}
        {outgoing.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-cream/50 tracking-[1.5px] uppercase mb-2.5">
              {t("friends.outgoingRequests")} ({outgoing.length})
            </p>
            <div className="space-y-2">
              {outgoing.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-cream/[0.03] border border-cream/[0.06]"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium text-dark shrink-0"
                    style={{ backgroundColor: "#C8A44E" }}
                  >
                    {req.toName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-cream font-nunito truncate">
                      {req.toName}
                    </p>
                  </div>
                  <span className="text-[10px] text-cream/40 font-nunito px-2 py-1 rounded-full bg-cream/[0.04]">
                    {t("friends.pending")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friend list */}
        <div>
          <p className="text-[10px] text-cream/50 tracking-[1.5px] uppercase mb-2.5">
            {t("friends.friendList")} ({friends.length})
          </p>
          {friends.length > 0 ? (
            <div className="space-y-2">
              {friends.map((friend, i) => (
                <motion.div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-cream/[0.03] border border-cream/[0.06] hover:bg-cream/[0.05] transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium text-dark shrink-0"
                    style={{ backgroundColor: friend.color || "#C8A44E" }}
                  >
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-cream font-nunito truncate">
                      {friend.name}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green/50" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-cream/[0.04] flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <circle cx="7" cy="7" r="3" stroke="#888" strokeWidth="1" />
                  <circle cx="13" cy="7" r="3" stroke="#888" strokeWidth="1" />
                  <path d="M2 16c0-3 2.5-5 5-5s5 2 5 5" stroke="#888" strokeWidth="1" fill="none" />
                  <path d="M11 16c0-3 2.5-5 5-5" stroke="#888" strokeWidth="1" fill="none" />
                </svg>
              </div>
              <p className="text-cream/30 text-sm font-nunito">
                {t("friends.noFriends")}
              </p>
              <p className="text-cream/20 text-xs font-nunito mt-1">
                {t("friends.addFriendHint")}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
