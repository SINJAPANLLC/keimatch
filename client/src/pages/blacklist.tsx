import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Building2, User, MapPin, Calendar } from "lucide-react";
import type { BlacklistEntry } from "@shared/schema";

const REASONS = [
  "すべて", "未払い", "虚偽登録", "無断キャンセル", "ハラスメント", "詐欺行為", "規約違反", "その他",
];

const TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  company: { label: "企業・荷主", color: "bg-red-600", icon: Building2 },
  driver: { label: "ドライバー", color: "bg-orange-500", icon: User },
};

function EntryCard({ entry }: { entry: BlacklistEntry }) {
  const typeInfo = TYPE_LABELS[entry.type] ?? TYPE_LABELS.company;
  const Icon = typeInfo.icon;

  return (
    <Card className="border border-destructive/20 shadow-sm" data-testid={`card-blacklist-${entry.id}`}>
      <CardContent className="pt-4 pb-4 px-5">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-full ${typeInfo.color} flex items-center justify-center shrink-0 mt-0.5`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`${typeInfo.color} text-white text-xs px-2 py-0.5 border-0`}>{typeInfo.label}</Badge>
              <Badge variant="outline" className="text-xs text-destructive border-destructive/40 px-2 py-0.5">
                {entry.reason}
              </Badge>
            </div>
            <h3 className="font-bold text-foreground text-base">{entry.name}</h3>
            {entry.detail && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{entry.detail}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {entry.prefecture && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />{entry.prefecture}
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Calendar className="w-3 h-3" />
                退会日：{new Date(entry.bannedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BlacklistPage() {
  const [activeType, setActiveType] = useState("all");
  const [activeReason, setActiveReason] = useState("すべて");

  const url = activeType !== "all" ? `/api/blacklist?type=${activeType}` : "/api/blacklist";
  const { data: entries = [], isLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ["/api/blacklist", activeType],
    queryFn: async () => { const res = await fetch(url); return res.json(); },
  });

  const filtered = activeReason === "すべて" ? entries : entries.filter(e => e.reason === activeReason);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-destructive py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/70 text-xs font-bold tracking-[0.2em] uppercase mb-3">BLACKLIST</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <AlertTriangle className="w-8 h-8" />強制退会リスト
          </h1>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            未払い・虚偽登録・悪質行為などにより強制退会となった企業・ドライバーの一覧です。<br className="hidden sm:inline" />
            取引前の確認にご活用ください。
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-0.5">ご注意</p>
            <p>掲載情報はKEI MATCHの管理者が確認・審査した上で公開しています。掲載に関するお問い合わせは<a href="/contact" className="underline">こちら</a>からご連絡ください。</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: "all", label: "すべて", color: "bg-slate-600" },
              { id: "company", label: "企業・荷主", color: "bg-red-600" },
              { id: "driver", label: "ドライバー", color: "bg-orange-500" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveType(t.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeType === t.id ? `${t.color} text-white border-transparent` : "border-border text-muted-foreground hover:bg-muted"}`}
                data-testid={`filter-type-${t.id}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {REASONS.map(r => (
              <button
                key={r}
                onClick={() => setActiveReason(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${activeReason === r ? "bg-destructive text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                data-testid={`filter-reason-${r}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">該当する情報はありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">{filtered.length}件</p>
            {filtered.map(entry => <EntryCard key={entry.id} entry={entry} />)}
          </div>
        )}
      </div>
    </div>
  );
}
