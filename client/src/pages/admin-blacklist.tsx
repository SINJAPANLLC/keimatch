import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, Plus, Building2, User, MapPin, Calendar } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import type { BlacklistEntry } from "@shared/schema";

const REASONS = ["未払い", "虚偽登録", "無断キャンセル", "ハラスメント", "詐欺行為", "規約違反", "その他"];
const PREFECTURES = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];

const TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  company: { label: "企業・荷主", color: "bg-red-600", icon: Building2 },
  driver: { label: "ドライバー", color: "bg-orange-500", icon: User },
};

export default function AdminBlacklistPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "company", name: "", reason: "未払い", detail: "", prefecture: "", bannedAt: new Date().toISOString().slice(0,10) });

  const { data: entries = [], isLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ["/api/blacklist"],
    queryFn: async () => { const res = await fetch("/api/blacklist"); return res.json(); },
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/blacklist", form),
    onSuccess: () => {
      toast({ title: "登録しました" });
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      setShowForm(false);
      setForm({ type: "company", name: "", reason: "未払い", detail: "", prefecture: "", bannedAt: new Date().toISOString().slice(0,10) });
    },
    onError: () => toast({ title: "登録に失敗しました", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/blacklist/${id}`),
    onSuccess: () => {
      toast({ title: "削除しました" });
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
    },
    onError: () => toast({ title: "削除に失敗しました", variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />強制退会リスト管理
            </h1>
            <p className="text-sm text-muted-foreground mt-1">未払い・悪質行為などにより強制退会となったユーザーを管理します</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-entry">
            <Plus className="w-4 h-4 mr-1.5" />新規登録
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6 border border-destructive/30">
            <CardContent className="pt-5 pb-6 px-5">
              <h3 className="font-bold text-foreground mb-4">新規登録</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">種別 <span className="text-destructive">*</span></label>
                  <div className="flex gap-2">
                    {[{id:"company",label:"企業・荷主"},{id:"driver",label:"ドライバー"}].map(t => (
                      <button key={t.id} type="button" onClick={() => setForm(f=>({...f,type:t.id}))}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.type===t.id ? "bg-destructive text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                        data-testid={`type-btn-${t.id}`}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">名前・会社名 <span className="text-destructive">*</span></label>
                    <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="例：株式会社◯◯、山田太郎" data-testid="input-name" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">退会理由 <span className="text-destructive">*</span></label>
                    <select value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" data-testid="select-reason">
                      {REASONS.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">都道府県</label>
                    <select value={form.prefecture} onChange={e=>setForm(f=>({...f,prefecture:e.target.value}))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" data-testid="select-prefecture">
                      <option value="">選択してください</option>
                      {PREFECTURES.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">退会日</label>
                    <Input type="date" value={form.bannedAt} onChange={e=>setForm(f=>({...f,bannedAt:e.target.value}))} data-testid="input-banned-at" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">詳細（任意）</label>
                  <Textarea value={form.detail} onChange={e=>setForm(f=>({...f,detail:e.target.value}))} placeholder="具体的な経緯・状況など（公開されます）" className="min-h-[80px]" data-testid="textarea-detail" />
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.reason || createMutation.isPending} variant="destructive" data-testid="button-submit">
                    {createMutation.isPending ? "登録中..." : "登録する"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>キャンセル</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">登録がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{entries.length}件</p>
            {entries.map(entry => {
              const typeInfo = TYPE_LABELS[entry.type] ?? TYPE_LABELS.company;
              const Icon = typeInfo.icon;
              return (
                <Card key={entry.id} className="border border-destructive/20" data-testid={`card-entry-${entry.id}`}>
                  <CardContent className="pt-4 pb-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full ${typeInfo.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={`${typeInfo.color} text-white text-xs border-0`}>{typeInfo.label}</Badge>
                          <Badge variant="outline" className="text-xs text-destructive border-destructive/40">{entry.reason}</Badge>
                        </div>
                        <p className="font-bold text-foreground">{entry.name}</p>
                        {entry.detail && <p className="text-sm text-muted-foreground mt-0.5">{entry.detail}</p>}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {entry.prefecture && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" />{entry.prefecture}</span>}
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Calendar className="w-3 h-3" />退会日：{new Date(entry.bannedAt).toLocaleDateString("ja-JP",{year:"numeric",month:"short",day:"numeric"})}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => { if(confirm("削除しますか？")) deleteMutation.mutate(entry.id); }}
                        data-testid={`button-delete-${entry.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
