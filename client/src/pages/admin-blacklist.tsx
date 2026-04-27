import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, Plus, Building2, User, MapPin, Calendar, Flag, Eye, X, FileImage, Paperclip, CheckCircle, Clock, ShieldCheck, MessageCircleWarning } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import type { BlacklistEntry, BlacklistReport } from "@shared/schema";

const REASONS = ["未払い", "虚偽登録", "無断キャンセル", "ハラスメント", "詐欺行為", "規約違反", "その他"];
const PREFECTURES = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];

const TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  company: { label: "企業・荷主", color: "bg-blue-600", icon: Building2 },
  driver: { label: "ドライバー", color: "bg-blue-400", icon: User },
  unknown: { label: "不明", color: "bg-slate-500", icon: User },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "未対応", color: "bg-amber-100 text-amber-800 border-amber-300" },
  reviewed: { label: "確認中", color: "bg-blue-100 text-blue-800 border-blue-300" },
  accepted: { label: "掲載済み", color: "bg-green-100 text-green-800 border-green-300" },
  rejected: { label: "却下", color: "bg-slate-100 text-slate-600 border-slate-300" },
};

function EvidencePreview({ data }: { data: string }) {
  if (data.startsWith("data:image")) {
    return <img src={data} alt="evidence" className="max-h-48 rounded-md border object-contain bg-muted" />;
  }
  return (
    <a href={data} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 underline">
      <Paperclip className="w-4 h-4" />PDFファイルを開く
    </a>
  );
}

function ReportCard({ report, onStatusChange, onDelete }: {
  report: BlacklistReport;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const statusInfo = STATUS_LABELS[report.status] ?? STATUS_LABELS.pending;

  return (
    <Card className="border border-blue-100 dark:border-blue-900/30" data-testid={`card-report-${report.id}`}>
      <CardContent className="pt-4 pb-4 px-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Flag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`text-xs px-2 py-0.5 border ${statusInfo.color}`}>{statusInfo.label}</Badge>
              <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">{report.reportReason}</Badge>
              {report.targetType !== "unknown" && (
                <Badge className={`${TYPE_LABELS[report.targetType]?.color ?? "bg-slate-500"} text-white text-xs border-0`}>
                  {TYPE_LABELS[report.targetType]?.label ?? report.targetType}
                </Badge>
              )}
            </div>
            <p className="font-bold text-foreground">{report.targetName}</p>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{report.reportContent}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted-foreground">
              {report.reporterName && <span>通報者：{report.reporterName}</span>}
              {report.reporterContact && <span>連絡先：{report.reporterContact}</span>}
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />{new Date(report.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              {(report.evidenceFiles?.length ?? 0) > 0 && (
                <button onClick={() => setShowEvidence(!showEvidence)} className="text-blue-600 flex items-center gap-1 hover:underline">
                  <FileImage className="w-3 h-3" />エビデンス {report.evidenceFiles?.length}件
                </button>
              )}
            </div>
            {showEvidence && (report.evidenceFiles?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {report.evidenceFiles!.map((d, i) => <EvidencePreview key={i} data={d} />)}
              </div>
            )}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                key !== report.status && (
                  <button
                    key={key}
                    onClick={() => onStatusChange(report.id, key)}
                    className={`text-xs px-2.5 py-1 rounded-full border ${val.color} hover:opacity-80 transition-opacity`}
                    data-testid={`status-btn-${key}-${report.id}`}
                  >
                    {val.label}にする
                  </button>
                )
              ))}
            </div>
          </div>
          <button
            onClick={() => { if (confirm("削除しますか？")) onDelete(report.id); }}
            className="text-muted-foreground hover:text-red-500 shrink-0"
            data-testid={`button-delete-report-${report.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminBlacklistPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"entries" | "reports">("entries");
  const [showForm, setShowForm] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [form, setForm] = useState({ type: "company", name: "", reason: "未払い", detail: "", prefecture: "", bannedAt: new Date().toISOString().slice(0, 10), source: "keimatch" });

  const { data: entries = [], isLoading: entriesLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ["/api/blacklist"],
    queryFn: async () => { const res = await fetch("/api/blacklist"); return res.json(); },
  });

  const reportUrl = reportStatusFilter !== "all" ? `/api/admin/blacklist/reports?status=${reportStatusFilter}` : "/api/admin/blacklist/reports";
  const { data: reports = [], isLoading: reportsLoading } = useQuery<BlacklistReport[]>({
    queryKey: ["/api/admin/blacklist/reports", reportStatusFilter],
    queryFn: async () => { const res = await fetch(reportUrl); return res.json(); },
    enabled: activeTab === "reports",
  });

  const pendingCount = reports.filter(r => r.status === "pending").length;

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/blacklist", form),
    onSuccess: () => {
      toast({ title: "登録しました" });
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      setShowForm(false);
      setForm({ type: "company", name: "", reason: "未払い", detail: "", prefecture: "", bannedAt: new Date().toISOString().slice(0, 10) });
    },
    onError: () => toast({ title: "登録に失敗しました", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/blacklist/${id}`),
    onSuccess: () => { toast({ title: "削除しました" }); queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] }); },
    onError: () => toast({ title: "削除に失敗しました", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/admin/blacklist/reports/${id}/status`, { status }),
    onSuccess: () => { toast({ title: "ステータスを更新しました" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/blacklist/reports"] }); },
    onError: () => toast({ title: "更新に失敗しました", variant: "destructive" }),
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/blacklist/reports/${id}`),
    onSuccess: () => { toast({ title: "削除しました" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/blacklist/reports"] }); },
    onError: () => toast({ title: "削除に失敗しました", variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-blue-600" />強制退会リスト管理
            </h1>
            <p className="text-sm text-muted-foreground mt-1">未払い・悪質行為などにより強制退会となったユーザーを管理します</p>
          </div>
          {activeTab === "entries" && (
            <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-entry">
              <Plus className="w-4 h-4 mr-1.5" />新規登録
            </Button>
          )}
        </div>

        <div className="flex gap-1 mb-6 border-b">
          <button
            onClick={() => setActiveTab("entries")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "entries" ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-entries"
          >
            強制退会リスト ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === "reports" ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-reports"
          >
            通報一覧
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        </div>

        {activeTab === "entries" && (
          <>
            {showForm && (
              <Card className="mb-6 border border-blue-200 dark:border-blue-800">
                <CardContent className="pt-5 pb-6 px-5">
                  <h3 className="font-bold text-foreground mb-4">新規登録</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">種別 <span className="text-blue-600">*</span></label>
                      <div className="flex gap-2">
                        {[{ id: "company", label: "企業・荷主" }, { id: "driver", label: "ドライバー" }].map(t => (
                          <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, type: t.id }))}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.type === t.id ? "bg-blue-600 text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                            data-testid={`type-btn-${t.id}`}>{t.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">名前・会社名 <span className="text-blue-600">*</span></label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：株式会社◯◯、山田太郎" data-testid="input-name" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">退会理由 <span className="text-blue-600">*</span></label>
                        <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" data-testid="select-reason">
                          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">情報の出所 <span className="text-blue-600">*</span></label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setForm(f => ({ ...f, source: "keimatch" }))}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.source === "keimatch" ? "bg-green-600 text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                          data-testid="source-btn-keimatch">
                          <ShieldCheck className="w-3.5 h-3.5" />KEI MATCH確認済み
                        </button>
                        <button type="button" onClick={() => setForm(f => ({ ...f, source: "report" }))}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.source === "report" ? "bg-amber-500 text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                          data-testid="source-btn-report">
                          <MessageCircleWarning className="w-3.5 h-3.5" />通報情報
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">都道府県</label>
                        <select value={form.prefecture} onChange={e => setForm(f => ({ ...f, prefecture: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" data-testid="select-prefecture">
                          <option value="">選択してください</option>
                          {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">退会日</label>
                        <Input type="date" value={form.bannedAt} onChange={e => setForm(f => ({ ...f, bannedAt: e.target.value }))} data-testid="input-banned-at" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">詳細（任意）</label>
                      <Textarea value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} placeholder="具体的な経緯・状況など（公開されます）" className="min-h-[80px]" data-testid="textarea-detail" />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.reason || createMutation.isPending} className="bg-blue-600 hover:bg-blue-700" data-testid="button-submit">
                        {createMutation.isPending ? "登録中..." : "登録する"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowForm(false)}>キャンセル</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {entriesLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
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
                    <Card key={entry.id} className="border border-blue-100 dark:border-blue-900/30" data-testid={`card-entry-${entry.id}`}>
                      <CardContent className="pt-4 pb-4 px-5">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-full ${typeInfo.color} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge className={`${typeInfo.color} text-white text-xs border-0`}>{typeInfo.label}</Badge>
                              <Badge variant="outline" className="text-xs text-blue-700 dark:text-blue-400 border-blue-200">{entry.reason}</Badge>
                              {(entry as any).source === "report" ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-amber-50 text-amber-700 border-amber-300">
                                  <MessageCircleWarning className="w-3 h-3" />通報情報
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-green-50 text-green-700 border-green-300">
                                  <ShieldCheck className="w-3 h-3" />KEI MATCH確認済み
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-foreground">{entry.name}</p>
                            {entry.detail && <p className="text-sm text-muted-foreground mt-0.5">{entry.detail}</p>}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {entry.prefecture && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" />{entry.prefecture}</span>}
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Calendar className="w-3 h-3" />退会日：{new Date(entry.bannedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 shrink-0"
                            onClick={() => { if (confirm("削除しますか？")) deleteMutation.mutate(entry.id); }}
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
          </>
        )}

        {activeTab === "reports" && (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {[
                { id: "all", label: "すべて" },
                { id: "pending", label: "未対応" },
                { id: "reviewed", label: "確認中" },
                { id: "accepted", label: "掲載済み" },
                { id: "rejected", label: "却下" },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setReportStatusFilter(s.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${reportStatusFilter === s.id ? "bg-blue-600 text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                  data-testid={`filter-status-${s.id}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {reportsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Flag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">通報はありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{reports.length}件</p>
                {reports.map(report => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                    onDelete={id => deleteReportMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
