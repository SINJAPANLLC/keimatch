import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Building2, User, MapPin, Calendar, Flag, X, Upload, FileImage, Paperclip, CheckCircle, ShieldCheck, MessageCircleWarning } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BlacklistEntry } from "@shared/schema";

const REASONS = [
  "すべて", "未払い", "虚偽登録", "無断キャンセル", "ハラスメント", "詐欺行為", "規約違反", "その他",
];
const REPORT_REASONS = ["未払い", "虚偽登録", "無断キャンセル", "ハラスメント", "詐欺行為", "規約違反", "その他"];

const TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  company: { label: "企業・荷主", color: "bg-blue-600", icon: Building2 },
  driver: { label: "ドライバー", color: "bg-blue-400", icon: User },
  unknown: { label: "不明", color: "bg-slate-500", icon: User },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SOURCE_LABELS: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  keimatch: { label: "KEI MATCH確認済み", cls: "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800", icon: ShieldCheck },
  report:   { label: "通報情報", cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800", icon: MessageCircleWarning },
};

function EntryCard({ entry, onReport }: { entry: BlacklistEntry; onReport: (entry: BlacklistEntry) => void }) {
  const typeInfo = TYPE_LABELS[entry.type] ?? TYPE_LABELS.company;
  const sourceInfo = SOURCE_LABELS[(entry as any).source ?? "keimatch"] ?? SOURCE_LABELS.keimatch;
  const SrcIcon = sourceInfo.icon;
  const Icon = typeInfo.icon;

  return (
    <Card className="border border-blue-100 dark:border-blue-900/30 shadow-sm" data-testid={`card-blacklist-${entry.id}`}>
      <CardContent className="pt-4 pb-4 px-5">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-full ${typeInfo.color} flex items-center justify-center shrink-0 mt-0.5`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`${typeInfo.color} text-white text-xs px-2 py-0.5 border-0`}>{typeInfo.label}</Badge>
              <Badge variant="outline" className="text-xs text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 px-2 py-0.5">
                {entry.reason}
              </Badge>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${sourceInfo.cls}`}>
                <SrcIcon className="w-3 h-3" />{sourceInfo.label}
              </span>
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
          <button
            onClick={() => onReport(entry)}
            className="shrink-0 text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors mt-0.5"
            data-testid={`button-report-${entry.id}`}
          >
            <Flag className="w-3.5 h-3.5" />通報
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportModal({ onClose, prefillTarget }: { onClose: () => void; prefillTarget?: BlacklistEntry | null }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    targetName: prefillTarget?.name ?? "",
    targetType: prefillTarget?.type ?? "unknown",
    reporterName: "",
    reporterContact: "",
    reportReason: "未払い",
    reportContent: "",
  });
  const [files, setFiles] = useState<{ name: string; size: number; data: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/blacklist/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, evidenceFiles: files.map(f => f.data) }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: (e: Error) => toast({ title: e.message || "送信に失敗しました", variant: "destructive" }),
  });

  const handleFiles = async (fileList: FileList) => {
    const newFiles: typeof files = [];
    for (const file of Array.from(fileList)) {
      if (files.length + newFiles.length >= MAX_FILES) { toast({ title: `最大${MAX_FILES}ファイルまでです`, variant: "destructive" }); break; }
      if (file.size > MAX_FILE_SIZE) { toast({ title: `${file.name} は5MB超のため除外しました`, variant: "destructive" }); continue; }
      setUploading(true);
      const data = await readFileAsBase64(file);
      newFiles.push({ name: file.name, size: file.size, data });
    }
    setUploading(false);
    setFiles(prev => [...prev, ...newFiles]);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">通報を受け付けました</h2>
          <p className="text-sm text-muted-foreground mb-6">内容を確認の上、対応いたします。ご協力ありがとうございました。</p>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">閉じる</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2"><Flag className="w-5 h-5 text-blue-600" />通報フォーム</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="button-close-modal"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-lg p-3">
            事実に基づいた情報をご提供ください。管理者が確認後、リストへの掲載を検討します。虚偽の通報はご遠慮ください。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">通報対象の名前・会社名 <span className="text-blue-600">*</span></label>
              <Input value={form.targetName} onChange={e => setForm(f => ({ ...f, targetName: e.target.value }))} placeholder="例：株式会社◯◯" data-testid="input-target-name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">種別</label>
              <select value={form.targetType} onChange={e => setForm(f => ({ ...f, targetType: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" data-testid="select-target-type">
                <option value="unknown">不明</option>
                <option value="company">企業・荷主</option>
                <option value="driver">ドライバー</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">通報理由 <span className="text-blue-600">*</span></label>
            <select value={form.reportReason} onChange={e => setForm(f => ({ ...f, reportReason: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" data-testid="select-report-reason">
              {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">詳細内容 <span className="text-blue-600">*</span></label>
            <Textarea value={form.reportContent} onChange={e => setForm(f => ({ ...f, reportContent: e.target.value }))} placeholder="具体的な状況・日時・金額など、事実をご記入ください" className="min-h-[100px]" data-testid="textarea-report-content" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              エビデンス（証拠）ファイル <span className="text-muted-foreground font-normal">最大{MAX_FILES}ファイル・各5MBまで</span>
            </label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              data-testid="dropzone-evidence"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">クリックまたはドラッグ＆ドロップでアップロード</p>
              <p className="text-xs text-muted-foreground mt-1">画像・PDF対応（各5MB以下）</p>
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
            </div>
            {uploading && <p className="text-xs text-blue-600 mt-2">読み込み中...</p>}
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
                    {f.data.startsWith("data:image") ? <FileImage className="w-4 h-4 text-blue-500 shrink-0" /> : <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <span className="text-xs flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)}KB</span>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-3">以下は任意です。内容確認のためにご連絡する場合があります。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">お名前（任意）</label>
                <Input value={form.reporterName} onChange={e => setForm(f => ({ ...f, reporterName: e.target.value }))} placeholder="山田太郎" data-testid="input-reporter-name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">連絡先・メール（任意）</label>
                <Input value={form.reporterContact} onChange={e => setForm(f => ({ ...f, reporterContact: e.target.value }))} placeholder="example@email.com" data-testid="input-reporter-contact" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => mutation.mutate()}
              disabled={!form.targetName || !form.reportContent || mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 flex-1"
              data-testid="button-submit-report"
            >
              {mutation.isPending ? "送信中..." : "通報を送信する"}
            </Button>
            <Button variant="outline" onClick={onClose}>キャンセル</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlacklistPage() {
  const [activeType, setActiveType] = useState("all");
  const [activeReason, setActiveReason] = useState("すべて");
  const [activeSource, setActiveSource] = useState("all");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<BlacklistEntry | null>(null);

  const url = activeType !== "all" ? `/api/blacklist?type=${activeType}` : "/api/blacklist";
  const { data: entries = [], isLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ["/api/blacklist", activeType],
    queryFn: async () => { const res = await fetch(url); return res.json(); },
  });

  const filtered = entries
    .filter(e => activeReason === "すべて" || e.reason === activeReason)
    .filter(e => activeSource === "all" || (e as any).source === activeSource);

  const openReport = (entry?: BlacklistEntry) => {
    setReportTarget(entry ?? null);
    setShowReportModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {showReportModal && (
        <ReportModal onClose={() => { setShowReportModal(false); setReportTarget(null); }} prefillTarget={reportTarget} />
      )}

      <section className="bg-blue-700 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/70 text-xs font-bold tracking-[0.2em] uppercase mb-3">BLACKLIST</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <AlertTriangle className="w-8 h-8" />強制退会リスト
          </h1>
          <p className="text-white/80 text-sm md:text-base leading-relaxed mb-5">
            未払い・虚偽登録・悪質行為などにより強制退会となった企業・ドライバーの一覧です。<br className="hidden sm:inline" />
            取引前の確認にご活用ください。
          </p>
          <button
            onClick={() => openReport()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-semibold text-sm rounded-full hover:bg-blue-50 transition-colors shadow"
            data-testid="button-open-report"
          >
            <Flag className="w-4 h-4" />通報する
          </button>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-semibold mb-0.5">KEI MATCH確認済み</p>
              <p className="text-xs leading-relaxed">KEI MATCH上でのトラブルを管理者が確認・審査した情報です。</p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <MessageCircleWarning className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-0.5">通報情報</p>
              <p className="text-xs leading-relaxed">他プラットフォーム含むユーザー通報を審査後に掲載した情報です。KEI MATCHが事実を保証するものではありません。</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: "all", label: "すべて", active: "bg-slate-700" },
              { id: "company", label: "企業・荷主", active: "bg-blue-600" },
              { id: "driver", label: "ドライバー", active: "bg-blue-400" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveType(t.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeType === t.id ? `${t.active} text-white border-transparent` : "border-border text-muted-foreground hover:bg-muted"}`}
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
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${activeReason === r ? "bg-blue-600 text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                data-testid={`filter-reason-${r}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: "all", label: "出所：すべて" },
              { id: "keimatch", label: "KEI MATCH確認済み" },
              { id: "report", label: "通報情報" },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSource(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${activeSource === s.id ? "bg-slate-700 text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                data-testid={`filter-source-${s.id}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">該当する情報はありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">{filtered.length}件</p>
            {filtered.map(entry => <EntryCard key={entry.id} entry={entry} onReport={openReport} />)}
          </div>
        )}

        <div className="mt-10 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">このリストに載っていない悪質な事業者を知っていますか？</p>
          <button
            onClick={() => openReport()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-full hover:bg-blue-700 transition-colors shadow"
            data-testid="button-open-report-bottom"
          >
            <Flag className="w-4 h-4" />通報フォームから報告する
          </button>
        </div>
      </div>
    </div>
  );
}
