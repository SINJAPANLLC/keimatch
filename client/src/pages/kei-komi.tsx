import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquarePlus, ChevronDown, ChevronUp, MapPin, Briefcase } from "lucide-react";
import type { KeiKomiPost } from "@shared/schema";

const CATEGORY_GROUPS = [
  {
    groupLabel: "デリバリーアプリ",
    categories: [
      { id: "amazon-flex", label: "Amazon Flex", color: "bg-orange-500" },
      { id: "uber-eats", label: "Uber Eats", color: "bg-green-600" },
      { id: "demaecan", label: "出前館", color: "bg-red-500" },
      { id: "menu", label: "menu", color: "bg-pink-500" },
      { id: "wolt", label: "Wolt", color: "bg-cyan-600" },
      { id: "pickgo", label: "PickGo", color: "bg-indigo-500" },
    ],
  },
  {
    groupLabel: "委託・軽貨物会社",
    categories: [
      { id: "yamato", label: "ヤマト運輸", color: "bg-yellow-600" },
      { id: "sagawa", label: "佐川急便", color: "bg-green-700" },
      { id: "japanpost", label: "日本郵便", color: "bg-red-700" },
      { id: "general-carrier", label: "軽貨物会社（一般）", color: "bg-blue-600" },
    ],
  },
  {
    groupLabel: "その他",
    categories: [
      { id: "general", label: "その他・一般", color: "bg-purple-600" },
    ],
  },
];

const ALL_CATEGORIES = [
  { id: "all", label: "すべて", color: "bg-slate-600" },
  ...CATEGORY_GROUPS.flatMap(g => g.categories),
];

const WORK_TYPES = ["宅配", "チャーター", "スポット", "定期", "その他"];
const PREFECTURES = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${sz} ${n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          data-testid={`star-${n}`}
        >
          <Star className={`w-7 h-7 transition-colors ${n <= (hovered || value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}

function PostCard({ post }: { post: KeiKomiPost }) {
  const [expanded, setExpanded] = useState(false);
  const cat = ALL_CATEGORIES.find(c => c.id === post.category);
  const isLong = post.body.length > 160;

  return (
    <Card className="border border-border shadow-sm hover:shadow-md transition-shadow" data-testid={`card-post-${post.id}`}>
      <CardContent className="pt-4 pb-5 px-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`${cat?.color ?? "bg-slate-600"} text-white text-xs px-2 py-0.5 border-0`}>{post.companyName}</Badge>
              <StarRating rating={post.rating} />
              <span className="text-xs text-muted-foreground font-medium">{post.rating}.0</span>
            </div>
            <h3 className="font-semibold text-foreground text-sm leading-snug">{post.title}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {isLong && !expanded ? post.body.slice(0, 160) + "…" : post.body}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary mt-1 flex items-center gap-0.5 hover:underline"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" />閉じる</> : <><ChevronDown className="w-3 h-3" />続きを読む</>}
          </button>
        )}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">{post.authorName}</span>
          {post.prefecture && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />{post.prefecture}
            </span>
          )}
          {post.workType && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Briefcase className="w-3 h-3" />{post.workType}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(post.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PostForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("amazon-flex");
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(3);
  const [authorName, setAuthorName] = useState("");
  const [workType, setWorkType] = useState("");
  const [prefecture, setPrefecture] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/kei-komi", { category, companyName, title, body, rating, authorName, workType, prefecture }),
    onSuccess: () => {
      toast({ title: "投稿を受け付けました", description: "審査後に公開されます。ありがとうございます！" });
      queryClient.invalidateQueries({ queryKey: ["/api/kei-komi"] });
      onClose();
    },
    onError: () => toast({ title: "投稿に失敗しました", variant: "destructive" }),
  });

  return (
    <Card className="border border-primary/30 shadow-md">
      <CardContent className="pt-5 pb-6 px-5 md:px-6">
        <h3 className="font-bold text-foreground text-base mb-4 flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5 text-primary" />口コミを投稿する
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">カテゴリー <span className="text-destructive">*</span></label>
            <div className="space-y-2">
              {CATEGORY_GROUPS.map(group => (
                <div key={group.groupLabel}>
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5">{group.groupLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.categories.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setCategory(c.id); setCompanyName(c.id === "general" || c.id === "general-carrier" ? "" : c.label); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === c.id ? `${c.color} text-white border-transparent` : "border-border text-muted-foreground hover:bg-muted"}`}
                        data-testid={`category-btn-${c.id}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">会社名・サービス名 <span className="text-destructive">*</span></label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="例：Amazon Flex、ヤマト運輸" data-testid="input-company-name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">投稿者名（任意）</label>
              <Input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="匿名（省略可）" data-testid="input-author-name" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">評価 <span className="text-destructive">*</span></label>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">タイトル <span className="text-destructive">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="一言でまとめると…" data-testid="input-title" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">口コミ本文 <span className="text-destructive">*</span></label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} className="min-h-[120px]" placeholder="実際の体験・稼ぎ・働き方など率直に教えてください。" data-testid="textarea-body" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">仕事の種類</label>
              <select value={workType} onChange={e => setWorkType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" data-testid="select-work-type">
                <option value="">選択してください</option>
                {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">都道府県</label>
              <select value={prefecture} onChange={e => setPrefecture(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" data-testid="select-prefecture">
                <option value="">選択してください</option>
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => mutation.mutate()}
              disabled={!category || !companyName || !title || !body || mutation.isPending}
              className="flex-1"
              data-testid="button-submit-post"
            >
              {mutation.isPending ? "送信中..." : "投稿する"}
            </Button>
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-post">キャンセル</Button>
          </div>
          <p className="text-xs text-muted-foreground">投稿内容は管理者が確認後に公開されます。</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KeiKomiPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const { data: posts = [], isLoading } = useQuery<KeiKomiPost[]>({
    queryKey: ["/api/kei-komi", activeCategory],
    queryFn: async () => {
      const url = activeCategory === "all" ? "/api/kei-komi" : `/api/kei-komi?category=${activeCategory}`;
      const res = await fetch(url);
      return res.json();
    },
  });

  const avgRating = posts.length > 0
    ? (posts.reduce((s, p) => s + p.rating, 0) / posts.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary-foreground/70 text-xs font-bold tracking-[0.2em] uppercase mb-3">KEI KOMI</p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">ケイコミ</h1>
          <p className="text-primary-foreground/80 text-sm md:text-base leading-relaxed">
            軽貨物ドライバーによる、リアルな口コミ・体験談掲示板。<br className="hidden sm:inline" />
            Amazon Flex・ヤマト・佐川など、働いて初めてわかる情報を共有しよう。
          </p>
          {avgRating && (
            <div className="mt-5 inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-5 py-2">
              <StarRating rating={Math.round(Number(avgRating))} size="md" />
              <span className="text-primary-foreground font-bold text-lg">{avgRating}</span>
              <span className="text-primary-foreground/70 text-sm">（{posts.length}件の口コミ）</span>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeCategory === "all" ? "bg-slate-600 text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                data-testid="filter-all"
              >
                すべて
              </button>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="shrink-0"
              data-testid="button-toggle-form"
            >
              <MessageSquarePlus className="w-4 h-4 mr-1.5" />
              口コミを書く
            </Button>
          </div>
          <div className="space-y-2">
            {CATEGORY_GROUPS.map(group => (
              <div key={group.groupLabel} className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider w-24 shrink-0">{group.groupLabel}</span>
                <div className="flex flex-wrap gap-1.5">
                  {group.categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        activeCategory === cat.id
                          ? `${cat.color} text-white border-transparent`
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                      data-testid={`filter-${cat.id}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showForm && (
          <div className="mb-6">
            <PostForm onClose={() => setShowForm(false)} />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageSquarePlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">まだ口コミがありません</p>
            <p className="text-sm mt-1">最初の口コミを投稿してみましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}

        <div className="mt-12 p-5 bg-muted/40 rounded-xl border border-border text-center">
          <p className="font-bold text-foreground mb-1">案件を探しているドライバーの方へ</p>
          <p className="text-sm text-muted-foreground mb-4">KEI MATCHでは軽貨物の案件を無料で検索・マッチングできます。</p>
          <Button asChild>
            <a href="/register" data-testid="link-register-cta">無料で案件を探す</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
