"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, ThumbsUp, ThumbsDown, Send, Flame, Clock, User } from "lucide-react";
import { API_BASE, type CommunityPost, type CommunityResponse } from "@/lib/api";

export default function CommunityPage() {
  const params = useParams();
  const symbol = (params.symbol as string).toUpperCase();
  const [data, setData] = useState<CommunityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [tab, setTab] = useState<"hot" | "recent">("hot");
  const [posting, setPosting] = useState(false);

  const fetchData = () => {
    fetch(`${API_BASE}/api/community/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [symbol]);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await fetch(`${API_BASE}/api/community/${symbol}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: author || "Anonymous", title, content, parentId: null }),
    });
    setContent("");
    setTitle("");
    fetchData();
    setPosting(false);
  };

  const handleReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    setPosting(true);
    await fetch(`${API_BASE}/api/community/${symbol}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: author || "Anonymous", content: replyContent, parentId }),
    });
    setReplyContent("");
    setReplyTo(null);
    fetchData();
    setPosting(false);
  };

  const handleVote = async (id: number, direction: "up" | "down") => {
    await fetch(`${API_BASE}/api/community/${symbol}/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    fetchData();
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  const posts = tab === "hot" ? (data?.hot || []) : (data?.recent || []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Community Discussion</h1>
        <p className="text-muted-theme text-sm mt-0.5">{symbol} &middot; {data?.total || 0} posts</p>
      </div>

      {/* Post Form */}
      <div className="card-3d p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-5 w-5 text-accent-theme" />
          <span className="text-sm font-semibold text-primary-theme">Start a Discussion</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="bg-input-theme border border-theme rounded-lg px-3 py-2 text-sm text-primary-theme placeholder-text-placeholder focus:outline-none focus:border-[#D4A017]"
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-input-theme border border-theme rounded-lg px-3 py-2 text-sm text-primary-theme placeholder-text-placeholder focus:outline-none focus:border-[#D4A017]"
          />
          <div />
        </div>
        <textarea
          placeholder="Share your analysis, insights, or questions..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full bg-input-theme border border-theme rounded-lg px-3 py-2 text-sm text-primary-theme placeholder-text-placeholder focus:outline-none focus:border-[#D4A017] resize-none mb-3"
        />
        <div className="flex justify-end">
          <button
            onClick={handlePost}
            disabled={!content.trim() || posting}
            className="btn-accent flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Post
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("hot")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "hot" ? "bg-[#D4A017] text-primary-theme" : "bg-input-theme text-body-theme border border-theme hover:bg-[#1e1e28]"
          }`}
        >
          <Flame className="h-4 w-4" /> Hot
        </button>
        <button
          onClick={() => setTab("recent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "recent" ? "bg-[#D4A017] text-primary-theme" : "bg-input-theme text-body-theme border border-theme hover:bg-[#1e1e28]"
          }`}
        >
          <Clock className="h-4 w-4" /> Recent
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-theme">
          <MessageSquare className="mb-3 h-10 w-10" />
          <p>No discussions yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="card-3d p-4">
              <div className="flex gap-3">
                {/* Vote column */}
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => handleVote(post.id, "up")} className="text-muted-theme hover:text-green-theme transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <span className={`text-sm font-bold font-mono ${post.votes > 0 ? "text-green-theme" : post.votes < 0 ? "text-red-theme" : "text-muted-theme"}`}>
                    {post.votes}
                  </span>
                  <button onClick={() => handleVote(post.id, "down")} className="text-muted-theme hover:text-red-theme transition-colors">
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {post.title && (
                    <h3 className="font-semibold text-primary-theme text-sm mb-1">{post.title}</h3>
                  )}
                  <p className="text-sm text-body-theme whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-theme">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {post.author}
                    </span>
                    <span>{formatTime(post.createdAt)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {post.replies} {post.replies === 1 ? "reply" : "replies"}
                    </span>
                  </div>

                  {/* Reply input */}
                  {replyTo === post.id ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleReply(post.id)}
                        className="flex-1 bg-input-theme border border-theme rounded-lg px-3 py-1.5 text-sm text-primary-theme placeholder-text-placeholder focus:outline-none focus:border-[#D4A017]"
                        autoFocus
                      />
                      <button onClick={() => handleReply(post.id)} disabled={!replyContent.trim()} className="btn-accent text-xs px-3 py-1.5 disabled:opacity-50">
                        Reply
                      </button>
                      <button onClick={() => { setReplyTo(null); setReplyContent(""); }} className="text-xs text-muted-theme hover:text-primary-theme px-2">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyTo(post.id)}
                      className="mt-2 text-xs text-accent-theme hover:text-accent-theme font-medium"
                    >
                      Reply
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
