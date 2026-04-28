import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, FileText, PenTool, Trash2, ChevronDown, ChevronUp,
  Loader2, Globe, Eye, EyeOff, Bot, ExternalLink, Clock, AlertTriangle,
  Link2, Link2Off, TrendingUp, RefreshCw, Play, Search, BarChart2, Pencil
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SeoArticle } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";

const KEYWORD_PRESETS = [
  { label: "軽貨物マッチング", value: "軽貨物, マッチング, 配送, ラストマイル" },
  { label: "空き車両情報", value: "空き車両, 空き車両情報, 配送, 軽貨物ドライバー" },
  { label: "配送DX", value: "配送DX, デジタル化, テクノロジー, 効率化" },
  { label: "コスト削減", value: "コスト削減, 配送費, 配送料金, 効率化" },
  { label: "2024年問題", value: "2024年問題, ドライバー不足, 働き方改革" },
  { label: "帰り便", value: "帰り便, 空き車両, コスト削減, 軽貨物マッチング" },
];

const CATEGORY_OPTIONS = [
  { value: "kyukakyusha", label: "軽貨物案件マッチング" },
  { value: "truck-order", label: "配送依頼・荷主向け" },
  { value: "carrier-sales", label: "ドライバーの案件獲得・営業" },
];

interface GscStatus { connected: boolean; lastSync: string | null; siteUrl: string; }
interface GscKeyword { keyword: string; impressions: number; clicks: number; position: number; ctr: number; }

export default function AdminSeo() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("kyukakyusha");
  const [autoPublish, setAutoPublish] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [rewriteRunning, setRewriteRunning] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gsc") === "connected") {
      toast({ title: "Search Console の接続が完了しました" });
      window.history.replaceState({}, "", "/admin/seo");
    } else if (params.get("gsc") === "error") {
      toast({ title: "Search Console の接続に失敗しました", variant: "destructive" });
      window.history.replaceState({}, "", "/admin/seo");
    }
  }, []);

  const { data: gscStatus, isLoading: gscLoading, refetch: refetchGsc } = useQuery<GscStatus>({
    queryKey: ["/api/admin/gsc/status"],
  });

  const { data: articles, isLoading } = useQuery<SeoArticle[]>({
    queryKey: ["/api/admin/seo-articles"],
  });

  const { data: gscKeywords, isLoading: kwLoading, refetch: refetchKeywords } = useQuery<GscKeyword[]>({
    queryKey: ["/api/admin/gsc/keywords"],
    enabled: false,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/seo-articles/generate", { topic, keywords, notes, autoPublish, category });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "記事を生成しました" });
      setTopic(""); setKeywords(""); setNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo-articles"] });
    },
    onError: () => toast({ title: "記事の生成に失敗しました", variant: "destructive" }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "published" ? "draft" : "published";
      await apiRequest("PATCH", `/api/admin/seo-articles/${id}`, { status: newStatus });
    },
    onSuccess: () => {
      toast({ title: "ステータスを更新しました" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo-articles"] });
    },
    onError: () => toast({ title: "更新に失敗しました", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/seo-articles/${id}`); },
    onSuccess: () => {
      toast({ title: "記事を削除しました" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo-articles"] });
    },
    onError: () => toast({ title: "記事の削除に失敗しました", variant: "destructive" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", "/api/admin/gsc/disconnect"); },
    onSuccess: () => {
      toast({ title: "Search Console を切断しました" });
      refetchGsc();
    },
  });

  const handleRunPipeline = async () => {
    setPipelineRunning(true);
    try {
      await apiRequest("POST", "/api/admin/gsc/run-pipeline");
      toast({ title: "パイプライン実行を開始しました（バックグラウンドで処理中）" });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/admin/seo-articles"] }), 30000);
    } catch {
      toast({ title: "パイプラインの起動に失敗しました", variant: "destructive" });
    } finally {
      setTimeout(() => setPipelineRunning(false), 3000);
    }
  };

  const handleRunRewrite = async () => {
    setRewriteRunning(true);
    try {
      await apiRequest("POST", "/api/admin/gsc/run-rewrite");
      toast({ title: "リライト実行を開始しました（バックグラウンドで処理中）" });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/admin/seo-articles"] }), 60000);
    } catch {
      toast({ title: "リライトの起動に失敗しました", variant: "destructive" });
    } finally {
      setTimeout(() => setRewriteRunning(false), 3000);
    }
  };

  const publishedCount = articles?.filter(a => a.status === "published").length || 0;
  const autoCount = articles?.filter(a => a.autoGenerated).length || 0;
  const rewriteCount = articles?.filter(a => (a as any).rewriteCount > 0).length || 0;
  const filteredArticles = articles?.filter(a => filterCategory === "all" || a.category === filterCategory) || [];

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">SEOコラム記事管理</h1>
          <p className="text-sm text-muted-foreground mt-1">GSCキーワード自動取得 → AI意図分析 → 記事構成 → 自動生成 → 週次リライト</p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="w-7 h-7 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-count">{articles?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">総記事数</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Globe className="w-7 h-7 text-green-600 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-published-count">{publishedCount}</p>
                  <p className="text-xs text-muted-foreground">公開中</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Bot className="w-7 h-7 text-blue-600 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-auto-count">{autoCount}</p>
                  <p className="text-xs text-muted-foreground">自動生成</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Pencil className="w-7 h-7 text-orange-500 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{rewriteCount}</p>
                  <p className="text-xs text-muted-foreground">リライト済</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GSC Connection Card */}
          <Card className={gscStatus?.connected ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30" : "border-dashed"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {gscLoading ? (
                    <Skeleton className="w-9 h-9 rounded-full" />
                  ) : gscStatus?.connected ? (
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Link2Off className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Google Search Console
                      {gscStatus?.connected && (
                        <Badge variant="default" className="ml-2 text-xs bg-green-600">接続済み</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {gscStatus?.connected
                        ? `${gscStatus.siteUrl} | 最終同期: ${gscStatus.lastSync ? new Date(gscStatus.lastSync).toLocaleString("ja-JP") : "未実行"}`
                        : "接続するとGSCキーワードで記事が自動生成されます"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gscStatus?.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      data-testid="button-gsc-disconnect"
                    >
                      <Link2Off className="w-3.5 h-3.5 mr-1" />
                      切断
                    </Button>
                  ) : (
                    <a href="/api/admin/gsc/connect">
                      <Button size="sm" data-testid="button-gsc-connect">
                        <Link2 className="w-3.5 h-3.5 mr-1" />
                        Search Console に接続
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {gscStatus?.connected && (
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchKeywords()}
                    disabled={kwLoading}
                    data-testid="button-fetch-keywords"
                  >
                    {kwLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-1" />}
                    キーワード取得
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRunPipeline}
                    disabled={pipelineRunning}
                    data-testid="button-run-pipeline"
                  >
                    {pipelineRunning ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                    {pipelineRunning ? "実行中..." : "パイプライン実行（今すぐ生成）"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRunRewrite}
                    disabled={rewriteRunning}
                    data-testid="button-run-rewrite"
                  >
                    {rewriteRunning ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                    {rewriteRunning ? "実行中..." : "週次リライト実行"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GSC Keywords Table */}
          {gscKeywords && gscKeywords.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  GSC 機会キーワード（表示多・クリック少）
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-1.5 pr-3">キーワード</th>
                        <th className="text-right py-1.5 px-2">表示</th>
                        <th className="text-right py-1.5 px-2">クリック</th>
                        <th className="text-right py-1.5 px-2">順位</th>
                        <th className="text-right py-1.5 pl-2">CTR%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gscKeywords.slice(0, 15).map((kw, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-1.5 pr-3 font-medium text-foreground max-w-[200px] truncate">{kw.keyword}</td>
                          <td className="text-right py-1.5 px-2 text-muted-foreground">{kw.impressions.toLocaleString()}</td>
                          <td className="text-right py-1.5 px-2 text-muted-foreground">{kw.clicks}</td>
                          <td className="text-right py-1.5 px-2">
                            <span className={kw.position > 15 ? "text-red-500" : kw.position > 10 ? "text-yellow-600" : "text-green-600"}>
                              {kw.position}位
                            </span>
                          </td>
                          <td className="text-right py-1.5 pl-2 text-muted-foreground">{kw.ctr}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pipeline & Schedule Info */}
          <Card>
            <CardContent className="p-4">
              <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                自動実行スケジュール
              </h2>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>毎日 06:00 — GSCキーワード取得 → 検索意図分析 → 記事構成設計 → 本文生成 → 自動公開（5記事）</span>
                </li>
                <li className="flex items-start gap-2">
                  <RefreshCw className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>毎週月曜 07:00 — 順位・CTR分析 → 15位以下 or CTR2%未満の記事を自動リライト（最大3記事）</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-yellow-600" />
                  <span>GSC未接続時は固定トピックリストで生成します</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Tabs defaultValue="articles">
            <TabsList>
              <TabsTrigger value="articles">記事一覧</TabsTrigger>
              <TabsTrigger value="manual">手動生成</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    手動で記事を生成
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo-category">カテゴリ（必須）</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="mt-1" data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="seo-topic">記事テーマ</Label>
                      <Input
                        id="seo-topic"
                        placeholder="例: 軽貨物マッチングサービスのメリット"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="mt-1"
                        data-testid="input-seo-topic"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">キーワードプリセット</Label>
                      <div className="flex flex-wrap gap-2">
                        {KEYWORD_PRESETS.map((preset) => (
                          <Badge
                            key={preset.label}
                            variant={keywords === preset.value ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => {
                              setKeywords(keywords === preset.value ? "" : preset.value);
                              if (!topic) setTopic(preset.label + "に関する最新動向");
                            }}
                            data-testid={`badge-preset-${preset.label}`}
                          >
                            {preset.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="seo-keywords">キーワード（カンマ区切り）</Label>
                      <Input
                        id="seo-keywords"
                        placeholder="例: 軽貨物, マッチング, 配送"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="mt-1"
                        data-testid="input-seo-keywords"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo-notes">備考・指示</Label>
                      <Textarea
                        id="seo-notes"
                        placeholder="記事の方向性や含めたい情報など..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 min-h-[80px]"
                        data-testid="input-seo-notes"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="auto-publish" checked={autoPublish} onCheckedChange={setAutoPublish} data-testid="switch-auto-publish" />
                      <Label htmlFor="auto-publish" className="text-sm">生成後すぐに公開する</Label>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => generateMutation.mutate()}
                      disabled={!topic.trim() || generateMutation.isPending}
                      data-testid="button-generate-article"
                    >
                      {generateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                      {generateMutation.isPending ? "生成中..." : "AIで記事を生成"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="articles" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      記事一覧
                    </h2>
                    <div className="flex items-center gap-2">
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-[160px] h-8 text-xs" data-testid="select-filter-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべてのカテゴリ</SelectItem>
                          {CATEGORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <a href="/column" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" data-testid="button-view-public">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          公開ページ
                        </Button>
                      </a>
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : !filteredArticles || filteredArticles.length === 0 ? (
                    <div className="text-center py-6">
                      <PenTool className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground" data-testid="text-empty-state">記事はまだありません</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredArticles.map((article) => (
                        <div key={article.id} className="border rounded-md" data-testid={`card-article-${article.id}`}>
                          <div
                            className="flex items-center justify-between gap-2 flex-wrap p-3 cursor-pointer"
                            onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                            data-testid={`button-expand-article-${article.id}`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
                              <div className="flex items-center gap-2 flex-wrap mt-1">
                                <Badge variant={article.status === "published" ? "default" : "secondary"} className="text-xs">
                                  {article.status === "published" ? "公開" : "下書き"}
                                </Badge>
                                {article.autoGenerated && (
                                  <Badge variant="outline" className="text-xs">
                                    <Bot className="w-3 h-3 mr-0.5" />自動
                                  </Badge>
                                )}
                                {(article as any).rewriteCount > 0 && (
                                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                                    <Pencil className="w-3 h-3 mr-0.5" />リライト×{(article as any).rewriteCount}
                                  </Badge>
                                )}
                                {article.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {CATEGORY_OPTIONS.find(c => c.value === article.category)?.label || article.category}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">{article.wordCount || 0}字</span>
                                {(article.wordCount || 0) < 800 && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-0.5" />noindex
                                  </Badge>
                                )}
                                {(article as any).gscPosition && (
                                  <span className={`text-xs font-medium ${(article as any).gscPosition > 15 ? "text-red-500" : (article as any).gscPosition > 10 ? "text-yellow-600" : "text-green-600"}`}>
                                    {(article as any).gscPosition}位
                                  </span>
                                )}
                                {(article as any).gscCtr && (
                                  <span className="text-xs text-muted-foreground">CTR {(article as any).gscCtr}%</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(article.createdAt).toLocaleDateString("ja-JP")}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); togglePublishMutation.mutate({ id: article.id, status: article.status }); }} data-testid={`button-toggle-publish-${article.id}`}>
                                {article.status === "published" ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-green-600" />}
                              </Button>
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(article.id); }} data-testid={`button-delete-article-${article.id}`}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                              {expandedId === article.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          </div>
                          {expandedId === article.id && (
                            <div className="border-t p-3">
                              {article.metaDescription && (
                                <div className="mb-3 p-2 bg-muted/50 rounded-md">
                                  <p className="text-xs text-muted-foreground font-medium mb-1">メタディスクリプション:</p>
                                  <p className="text-xs text-foreground">{article.metaDescription}</p>
                                </div>
                              )}
                              {(article as any).gscImpressions > 0 && (
                                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                                  <p className="text-xs text-muted-foreground font-medium mb-1">GSCパフォーマンス（直近28日）:</p>
                                  <div className="flex gap-4 text-xs">
                                    <span>表示: <b>{(article as any).gscImpressions}</b></span>
                                    <span>クリック: <b>{(article as any).gscClicks}</b></span>
                                    <span>順位: <b>{(article as any).gscPosition}位</b></span>
                                    <span>CTR: <b>{(article as any).gscCtr}%</b></span>
                                  </div>
                                </div>
                              )}
                              {article.slug && (
                                <div className="mb-3">
                                  <p className="text-xs text-muted-foreground">URL: <a href={`/column/${article.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">/column/{article.slug}</a></p>
                                </div>
                              )}
                              {article.faq && (
                                <div className="mb-3 p-2 bg-muted/50 rounded-md">
                                  <p className="text-xs text-muted-foreground font-medium mb-1">FAQ:</p>
                                  {(() => {
                                    try {
                                      const faqItems = JSON.parse(article.faq);
                                      return faqItems.map((item: any, i: number) => (
                                        <div key={i} className="mb-1">
                                          <p className="text-xs font-medium text-foreground">Q: {item.question}</p>
                                          <p className="text-xs text-muted-foreground ml-3">A: {item.answer}</p>
                                        </div>
                                      ));
                                    } catch { return <p className="text-xs text-muted-foreground">FAQデータなし</p>; }
                                  })()}
                                </div>
                              )}
                              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }} data-testid={`text-article-content-${article.id}`} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}

function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, "</p><p class='mt-2'>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>").replace(/$/, "</p>");
}
