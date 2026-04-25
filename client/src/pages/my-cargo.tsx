import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Package, Trash2, Plus, ArrowUpDown, ArrowRight, Clock, CircleDot, Eye, CheckCircle2, XCircle, Building2, Phone, Mail, FileText, Loader2, Circle, X, ChevronLeft, ChevronRight, Truck, Pencil, Download, Search, Save } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CargoListing } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { formatPrice } from "@/lib/utils";
import { useState, useMemo, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

const AREAS = ["北海道","青森","岩手","宮城","秋田","山形","福島","茨城","栃木","群馬","埼玉","千葉","東京","神奈川","新潟","富山","石川","福井","山梨","長野","岐阜","静岡","愛知","三重","滋賀","京都","大阪","兵庫","奈良","和歌山","鳥取","島根","岡山","広島","山口","徳島","香川","愛媛","高知","福岡","佐賀","長崎","熊本","大分","宮崎","鹿児島","沖縄"];
const VEHICLE_TYPES_E = ["軽バン","軽トラック","軽冷凍車","軽冷蔵車","軽ワゴン","バイク便","その他"];
const BODY_TYPES_E = ["標準ボディ","ハイルーフ","幌車","冷蔵仕様","冷凍仕様","パワーゲート付き","その他"];
const TIME_OPTIONS_E = ["指定なし","午前中","午後","夕方以降","終日可","0:00","1:00","2:00","3:00","4:00","5:00","6:00","7:00","8:00","9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00","24:00"];
const TEMP_CONTROLS_E = ["指定なし","常温","冷蔵（0〜10℃）","冷凍（-18℃以下）","定温"];
const HIGHWAY_FEE_E = ["込み","別途","高速代なし"];
const TRANSPORT_TYPE_E = ["スポット","定期"];
const CONSOLIDATION_E = ["不可","可能"];
const DRIVER_WORK_E = ["手積み手降ろし","台車使用","エレベーター有","階段搬入","設置作業あり","その他"];

const STATUS_FILTERS = [
  { label: "全て", value: "all" },
  { label: "掲載中", value: "active" },
  { label: "不成約", value: "cancelled" },
];

const PER_PAGE_OPTIONS = [20, 50, 100];

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-0.5" data-testid="pagination">
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        data-testid="button-prev-page"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
        ) : (
          <Button
            key={p}
            variant={page === p ? "default" : "ghost"}
            size="icon"
            onClick={() => onPageChange(p as number)}
            data-testid={`button-page-${p}`}
          >
            <span className="text-xs">{p}</span>
          </Button>
        )
      )}
      <Button
        variant="ghost"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        data-testid="button-next-page"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function DetailRow({ label, value, children }: { label: string; value?: string | null | undefined; children?: React.ReactNode }) {
  return (
    <div className="flex border-b border-border last:border-b-0">
      <div className="w-[90px] sm:w-[110px] shrink-0 bg-muted/30 px-2 sm:px-3 py-2.5 text-xs font-bold text-muted-foreground">{label}</div>
      <div className="flex-1 px-3 py-2.5 text-sm font-bold text-foreground whitespace-pre-wrap">{children || value || "-"}</div>
    </div>
  );
}

type CompanyInfo = {
  companyName: string;
  address: string | null;
  phone: string;
  fax: string | null;
  email: string;
  contactName: string | null;
  userType: string;
  truckCount: string | null;
  paymentTerms: string | null;
  businessDescription: string | null;
  companyNameKana: string | null;
  postalCode: string | null;
  websiteUrl: string | null;
  invoiceRegistrationNumber: string | null;
  registrationDate: string | null;
  representative: string | null;
  establishedDate: string | null;
  capital: string | null;
  employeeCount: string | null;
  officeLocations: string | null;
  annualRevenue: string | null;
  bankInfo: string | null;
  majorClients: string | null;
  closingMonth: string | null;
  closingDay: string | null;
  paymentMonth: string | null;
  paymentDay: string | null;
  businessArea: string | null;
  autoInvoiceAcceptance: string | null;
  memberOrganization: string | null;
  transportLicenseNumber: string | null;
  digitalTachographCount: string | null;
  gpsCount: string | null;
  safetyExcellenceCert: string | null;
  greenManagementCert: string | null;
  iso9000: string | null;
  iso14000: string | null;
  iso39001: string | null;
  cargoInsurance: string | null;
  cargoCount1m: number;
  cargoCount3m: number;
  truckCount1m: number;
  truckCount3m: number;
};

function CargoDetailPanel({ listing, onClose, defaultTab = "cargo" }: { listing: CargoListing | null; onClose: () => void; defaultTab?: "cargo" | "company" | "edit" }) {
  const [panelTab, setPanelTab] = useState<"cargo" | "company" | "edit">(defaultTab);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const [editForm, setEditForm] = useState<Partial<CargoListing>>({});
  const [editSaved, setEditSaved] = useState(false);

  useEffect(() => {
    setNoteText(listing?.privateNote || "");
    setNoteSaved(false);
    if (listing) {
      setEditForm({
        departureArea: listing.departureArea || "",
        departureAddress: listing.departureAddress || "",
        arrivalArea: listing.arrivalArea || "",
        arrivalAddress: listing.arrivalAddress || "",
        desiredDate: listing.desiredDate || "",
        departureTime: listing.departureTime || "",
        arrivalDate: listing.arrivalDate || "",
        arrivalTime: listing.arrivalTime || "",
        cargoType: listing.cargoType || "",
        weight: listing.weight || "",
        vehicleType: listing.vehicleType || "",
        bodyType: listing.bodyType || "",
        temperatureControl: listing.temperatureControl || "",
        price: listing.price || "",
        highwayFee: listing.highwayFee || "",
        transportType: listing.transportType || "",
        consolidation: listing.consolidation || "",
        driverWork: listing.driverWork || "",
        description: listing.description || "",
        contactPerson: listing.contactPerson || "",
        paymentDate: listing.paymentDate || "",
      });
      setEditSaved(false);
    }
  }, [listing?.id]);

  const saveNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await apiRequest("PATCH", `/api/cargo/${id}`, { privateNote: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-cargo"] });
      setNoteSaved(true);
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
      noteTimerRef.current = setTimeout(() => setNoteSaved(false), 2000);
    },
    onError: () => {
      toast({ title: "エラー", description: "メモの保存に失敗しました", variant: "destructive" });
    },
  });

  const completeCargoMutation = useMutation({
    mutationFn: async (cargoId: string) => {
      await apiRequest("PATCH", `/api/cargo/${cargoId}/status`, { status: "completed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-cargo"] });
      toast({ title: "成約しました", description: "荷物のステータスが成約済みに変更されました" });
      onClose();
    },
    onError: () => {
      toast({ title: "エラー", description: "成約処理に失敗しました", variant: "destructive" });
    },
  });

  const updateCargoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CargoListing> }) => {
      await apiRequest("PATCH", `/api/cargo/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-cargo"] });
      setEditSaved(true);
      setTimeout(() => setEditSaved(false), 2500);
      toast({ title: "保存しました", description: "案件情報を更新しました" });
    },
    onError: () => {
      toast({ title: "エラー", description: "更新に失敗しました", variant: "destructive" });
    },
  });

  const { data: companyInfo } = useQuery<CompanyInfo>({
    queryKey: ["/api/companies", listing?.userId],
    enabled: !!listing?.userId,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setPanelTab(defaultTab);
  }, [listing?.id, defaultTab]);

  const handlePrint = () => {
    if (!listing) return;
    const fmtDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return "指定なし";
      const cleaned = dateStr.replace(/\//g, "-");
      const d = new Date(cleaned);
      if (isNaN(d.getTime())) return dateStr;
      const days = ["日", "月", "火", "水", "木", "金", "土"];
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}(${days[d.getDay()]})`;
    };
    const row = (label: string, value: string | null | undefined) =>
      `<tr><td style="padding:6px 10px;font-weight:bold;white-space:nowrap;border:1px solid #ddd;background:#f9f9f9;font-size:13px;width:140px">${label}</td><td style="padding:6px 10px;border:1px solid #ddd;font-size:13px">${value || "-"}</td></tr>`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>荷物情報 - ${listing.companyName}</title>
<style>body{font-family:'Hiragino Sans','Meiryo',sans-serif;margin:20px;color:#333}h2{font-size:18px;border-bottom:2px solid #40E0D0;padding-bottom:6px;margin:20px 0 12px}table{border-collapse:collapse;width:100%;margin-bottom:16px}.header{text-align:center;margin-bottom:24px}.header h1{font-size:22px;color:#40E0D0;margin:0}.route{display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ddd;border-radius:6px;margin-bottom:12px}.route-side{flex:1}.route-arrow{padding:0 16px;font-size:20px;color:#999}.price{font-size:22px;font-weight:bold;margin-bottom:16px}@media print{body{margin:10px}}</style></head><body>
<div class="header"><h1>KEI MATCH 案件情報</h1><p style="font-size:12px;color:#888">印刷日: ${new Date().toLocaleString("ja-JP")}</p></div>
<h2>荷物情報</h2>
<div class="route"><div class="route-side"><div style="font-weight:bold;font-size:14px">${fmtDate(listing.desiredDate)} ${listing.departureTime && listing.departureTime !== "指定なし" ? listing.departureTime : ""}</div><div style="font-weight:bold;font-size:14px;margin-top:4px">${listing.departureArea} ${listing.departureAddress || ""}</div></div><div class="route-arrow">→</div><div class="route-side" style="text-align:right"><div style="font-weight:bold;font-size:14px">${fmtDate(listing.arrivalDate)} ${listing.arrivalTime && listing.arrivalTime !== "指定なし" ? listing.arrivalTime : ""}</div><div style="font-weight:bold;font-size:14px;margin-top:4px">${listing.arrivalArea} ${listing.arrivalAddress || ""}</div></div></div>
<div class="price">${listing.price ? `¥${Number(listing.price).toLocaleString()}` : "要相談"} ${listing.taxType ? `(${listing.taxType})` : ""} 高速代: ${listing.highwayFee || "未設定"}</div>
<table>${row("荷物番号", listing.cargoNumber ? String(listing.cargoNumber) : "-")}${row("企業名", listing.companyName)}${row("担当者", listing.contactPerson)}${row("連絡先", listing.contactPhone)}${row("荷種", listing.cargoType)}${row("積合", listing.consolidation || "不可")}${row("希望車種", `重量：${listing.weight || "-"} 車種：${listing.vehicleType}${listing.bodyType ? `-${listing.bodyType}` : ""}`)}${row("車両指定", listing.vehicleSpec || "指定なし")}${row("必要装備", listing.equipment || "標準装備")}${row("備考", listing.description)}${row("発着日時", `${fmtDate(listing.desiredDate)} ${listing.departureTime || ""}${listing.loadingTime ? ` (積み時間：${listing.loadingTime})` : ""} → ${fmtDate(listing.arrivalDate)} ${listing.arrivalTime || ""}${listing.unloadingTime ? ` (卸し時間：${listing.unloadingTime})` : ""}`)}${row("入金予定日", listing.paymentDate || "登録された支払いサイトに準拠します。")}</table>
<h2>企業情報</h2><h3 style="font-size:14px;margin:8px 0">基本情報</h3>
<table>${row("法人名・事業者名", companyInfo?.companyName || listing.companyName)}${row("住所", companyInfo?.postalCode ? `〒${companyInfo.postalCode} ${companyInfo.address || "-"}` : companyInfo?.address || "-")}${row("電話番号", listing.contactPhone)}${row("FAX番号", companyInfo?.fax)}${row("請求事業者登録番号", companyInfo?.invoiceRegistrationNumber)}${row("業務内容・会社PR", companyInfo?.businessDescription)}${row("保有車両台数", companyInfo?.truckCount ? `${companyInfo.truckCount} 台` : "-")}${row("ウェブサイトURL", companyInfo?.websiteUrl)}</table>
<h3 style="font-size:14px;margin:8px 0">詳細情報</h3>
<table>${row("代表者", companyInfo?.representative)}${row("設立", companyInfo?.establishedDate)}${row("資本金", companyInfo?.capital ? `${companyInfo.capital} 万円` : null)}${row("従業員数", companyInfo?.employeeCount)}${row("事業所所在地", companyInfo?.officeLocations)}${row("年間売上", companyInfo?.annualRevenue ? `${companyInfo.annualRevenue} 万円` : null)}${row("取引先銀行", companyInfo?.bankInfo)}${row("主要取引先", companyInfo?.majorClients)}${row("締め日", [companyInfo?.closingMonth, companyInfo?.closingDay].filter(Boolean).join(" ") || null)}${row("支払月・支払日", [companyInfo?.paymentMonth, companyInfo?.paymentDay].filter(Boolean).join(" ") || null)}${row("営業地域", companyInfo?.businessArea)}</table>
<h3 style="font-size:14px;margin:8px 0">信用情報</h3>
<table>${row("加入組織", companyInfo?.memberOrganization)}${row("国交省認可番号", companyInfo?.transportLicenseNumber)}${row("デジタコ搭載数", companyInfo?.digitalTachographCount)}${row("GPS搭載数", companyInfo?.gpsCount)}${row("安全性優良事業所", companyInfo?.safetyExcellenceCert || "無")}${row("グリーン経営認証", companyInfo?.greenManagementCert || "無")}${row("ISO9000", companyInfo?.iso9000 || "無")}${row("ISO14000", companyInfo?.iso14000 || "無")}${row("ISO39001", companyInfo?.iso39001 || "無")}${row("荷物保険", companyInfo?.cargoInsurance)}</table></body></html>`;
    const printWindow = window.open("", "_blank");
    if (printWindow) { printWindow.document.write(html); printWindow.document.close(); printWindow.onload = () => { printWindow.print(); }; }
  };

  if (!listing) {
    return (
      <div className="w-full sm:w-[420px] shrink-0 border-l border-border bg-background h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  const formatDateWithDay = (dateStr: string | null | undefined) => {
    if (!dateStr) return "指定なし";
    const cleaned = dateStr.replace(/\//g, "-");
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return dateStr;
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}(${days[d.getDay()]})`;
  };

  return (
    <div className="w-full sm:w-[420px] shrink-0 border-l border-border bg-background h-full overflow-y-auto" data-testid="panel-cargo-detail">
      <div className="sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setPanelTab("cargo")}
              className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${panelTab === "cargo" ? "text-primary border border-primary bg-primary/5" : "text-muted-foreground"}`}
              data-testid="tab-cargo-info"
            >
              荷物情報
            </button>
            <button
              onClick={() => setPanelTab("company")}
              className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${panelTab === "company" ? "text-primary border border-primary bg-primary/5" : "text-muted-foreground"}`}
              data-testid="tab-company-info"
            >
              企業情報
            </button>
            <button
              onClick={() => setPanelTab("edit")}
              className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${panelTab === "edit" ? "text-primary border border-primary bg-primary/5" : "text-muted-foreground"}`}
              data-testid="tab-edit"
            >
              編集
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={handlePrint} data-testid="button-print">
              印刷
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-panel">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {panelTab === "cargo" ? (
        <div className="p-4 space-y-4">
          <div className="border border-border rounded-md p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <span>{formatDateWithDay(listing.desiredDate)}</span>
                  <span>{listing.departureTime && listing.departureTime !== "指定なし" ? listing.departureTime : ""}</span>
                </div>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {listing.departureArea} {listing.departureAddress || ""}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
              <div className="flex-1 text-right">
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground justify-end">
                  <span>{formatDateWithDay(listing.arrivalDate)}</span>
                  <span>{listing.arrivalTime && listing.arrivalTime !== "指定なし" ? listing.arrivalTime : ""}</span>
                </div>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {listing.arrivalArea} {listing.arrivalAddress || ""}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-foreground">{listing.price ? `¥${formatPrice(listing.price)}` : "要相談"}</span>
            <span className="text-xs text-muted-foreground font-bold">高速代: {listing.highwayFee || "未設定"}</span>
          </div>


          <div className="border border-border rounded-md overflow-hidden">
            <DetailRow label="荷物番号" value={listing.cargoNumber ? String(listing.cargoNumber) : "-"} />
            <DetailRow label="企業名">
              <div>
                <div className="font-bold">{listing.companyName}</div>
                <div className="flex items-center gap-3 mt-1">
                  <button onClick={() => setPanelTab("company")} className="text-xs text-primary font-bold">他の荷物をみる &gt;</button>
                  <button onClick={() => setPanelTab("company")} className="text-xs text-primary font-bold">実績をみる &gt;</button>
                </div>
              </div>
            </DetailRow>
            <DetailRow label="過去成約">
              <Badge variant="outline" className="text-[10px]">なし</Badge>
            </DetailRow>
            <DetailRow label="担当者" value={listing.contactPerson} />
            <DetailRow label="連絡方法">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{listing.contactPhone}</span>
              </div>
            </DetailRow>
            <DetailRow label="荷種">
              <div>{listing.cargoType}</div>
            </DetailRow>
            <DetailRow label="積合" value={listing.consolidation || "不可"} />
            <DetailRow label="希望車種" value={`重量：${listing.weight || "-"} 車種：${listing.vehicleType}${listing.bodyType ? `-${listing.bodyType}` : ""}`} />
            <DetailRow label="車両指定" value={listing.vehicleSpec || "指定なし"} />
            <DetailRow label="必要装備" value={listing.equipment || "標準装備"} />
            <DetailRow label="備考" value={listing.description} />
            <DetailRow label="発着日時">
              <div>
                <div>{formatDateWithDay(listing.desiredDate)} {listing.departureTime || ""}{listing.loadingTime ? ` (積み時間：${listing.loadingTime})` : ""}</div>
                <div>{formatDateWithDay(listing.arrivalDate)} {listing.arrivalTime || ""}{listing.unloadingTime ? ` (卸し時間：${listing.unloadingTime})` : ""}</div>
              </div>
            </DetailRow>
            <DetailRow label="入金予定日" value={listing.paymentDate || "登録された支払いサイトに準拠します。"} />
            <DetailRow label="登録日時" value={listing.createdAt ? new Date(listing.createdAt).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit" }) : "-"} />
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {listing.transportType && (
                <Badge variant="outline" className="text-xs text-foreground">{listing.transportType}</Badge>
              )}
              <Badge variant="default">{listing.status === "active" ? "募集中" : listing.status === "completed" ? "成約済" : "終了"}</Badge>
            </div>
            <div className="text-xs text-muted-foreground font-bold">
              閲覧数: {listing.viewCount}
            </div>
          </div>

          <div className="border border-border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground">案件メモ（自分だけに表示）</span>
              </div>
              <div className="flex items-center gap-1.5">
                {noteSaved && <span className="text-xs text-green-600 font-bold">保存しました</span>}
                {saveNoteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
              </div>
            </div>
            <Textarea
              placeholder="荷主名や案件の詳細メモを入力..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              data-testid="input-private-note"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              disabled={saveNoteMutation.isPending || noteText === (listing.privateNote || "")}
              onClick={() => listing && saveNoteMutation.mutate({ id: listing.id, note: noteText })}
              data-testid="button-save-note"
            >
              {saveNoteMutation.isPending ? "保存中..." : "メモを保存"}
            </Button>
          </div>
        </div>
      ) : panelTab === "edit" ? (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">案件情報の編集</h3>
            {editSaved && <span className="text-xs text-green-600 font-bold">保存しました ✓</span>}
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-muted-foreground border-b border-border pb-1">発着地</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">発地（都道府県）</label>
                <Select value={editForm.departureArea || ""} onValueChange={v => setEditForm(f => ({...f, departureArea: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">着地（都道府県）</label>
                <Select value={editForm.arrivalArea || ""} onValueChange={v => setEditForm(f => ({...f, arrivalArea: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">発地詳細</label>
                <Input className="h-8 text-xs" value={editForm.departureAddress || ""} onChange={e => setEditForm(f => ({...f, departureAddress: e.target.value}))} placeholder="市区町村以下" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">着地詳細</label>
                <Input className="h-8 text-xs" value={editForm.arrivalAddress || ""} onChange={e => setEditForm(f => ({...f, arrivalAddress: e.target.value}))} placeholder="市区町村以下" />
              </div>
            </div>

            <div className="text-xs font-bold text-muted-foreground border-b border-border pb-1 pt-1">日時</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">発日</label>
                <Input className="h-8 text-xs" value={editForm.desiredDate || ""} onChange={e => setEditForm(f => ({...f, desiredDate: e.target.value}))} placeholder="YYYY/MM/DD" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">発時間</label>
                <Select value={editForm.departureTime || ""} onValueChange={v => setEditForm(f => ({...f, departureTime: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{TIME_OPTIONS_E.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">着日</label>
                <Input className="h-8 text-xs" value={editForm.arrivalDate || ""} onChange={e => setEditForm(f => ({...f, arrivalDate: e.target.value}))} placeholder="YYYY/MM/DD" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">着時間</label>
                <Select value={editForm.arrivalTime || ""} onValueChange={v => setEditForm(f => ({...f, arrivalTime: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{TIME_OPTIONS_E.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-xs font-bold text-muted-foreground border-b border-border pb-1 pt-1">荷物・車両</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">荷種</label>
                <Input className="h-8 text-xs" value={editForm.cargoType || ""} onChange={e => setEditForm(f => ({...f, cargoType: e.target.value}))} placeholder="食品・家電 等" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">重量</label>
                <Input className="h-8 text-xs" value={editForm.weight || ""} onChange={e => setEditForm(f => ({...f, weight: e.target.value}))} placeholder="例: 100kg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">車種</label>
                <Select value={editForm.vehicleType || ""} onValueChange={v => setEditForm(f => ({...f, vehicleType: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{VEHICLE_TYPES_E.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">車体</label>
                <Select value={editForm.bodyType || ""} onValueChange={v => setEditForm(f => ({...f, bodyType: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{BODY_TYPES_E.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-xs font-bold text-muted-foreground border-b border-border pb-1 pt-1">運賃・条件</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">運賃（税別）</label>
                <Input className="h-8 text-xs" value={editForm.price || ""} onChange={e => setEditForm(f => ({...f, price: e.target.value}))} placeholder="例: 15000" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">高速代</label>
                <Select value={editForm.highwayFee || ""} onValueChange={v => setEditForm(f => ({...f, highwayFee: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{HIGHWAY_FEE_E.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">形態</label>
                <Select value={editForm.transportType || ""} onValueChange={v => setEditForm(f => ({...f, transportType: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{TRANSPORT_TYPE_E.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">積合</label>
                <Select value={editForm.consolidation || ""} onValueChange={v => setEditForm(f => ({...f, consolidation: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{CONSOLIDATION_E.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">作業</label>
                <Select value={editForm.driverWork || ""} onValueChange={v => setEditForm(f => ({...f, driverWork: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{DRIVER_WORK_E.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">温度管理</label>
                <Select value={editForm.temperatureControl || ""} onValueChange={v => setEditForm(f => ({...f, temperatureControl: v}))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{TEMP_CONTROLS_E.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-xs font-bold text-muted-foreground border-b border-border pb-1 pt-1">その他</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">担当者</label>
                <Input className="h-8 text-xs" value={editForm.contactPerson || ""} onChange={e => setEditForm(f => ({...f, contactPerson: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">入金予定日</label>
                <Input className="h-8 text-xs" value={editForm.paymentDate || ""} onChange={e => setEditForm(f => ({...f, paymentDate: e.target.value}))} placeholder="月末締め翌月末払い 等" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">備考</label>
              <Textarea className="text-xs min-h-[60px] resize-none" value={editForm.description || ""} onChange={e => setEditForm(f => ({...f, description: e.target.value}))} placeholder="備考・特記事項" />
            </div>
          </div>

          <Button
            className="w-full"
            disabled={updateCargoMutation.isPending}
            onClick={() => listing && updateCargoMutation.mutate({ id: listing.id, data: editForm })}
            data-testid="button-save-edit"
          >
            {updateCargoMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</> : <><Save className="w-4 h-4 mr-2" />変更を保存</>}
          </Button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <h3 className="text-base font-bold text-foreground">{companyInfo?.companyName || listing.companyName}</h3>

          <Card className="p-3">
            <div className="text-xs font-bold text-muted-foreground mb-3">KEI MATCHでの実績</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-bold">委託</span>
                </div>
                <div className="text-xs text-muted-foreground font-bold">成約 <span className="text-lg text-foreground">{companyInfo?.cargoCount1m ?? 0}</span></div>
                <div className="text-xs text-muted-foreground font-bold">登録 <span className="text-lg text-foreground">{companyInfo?.cargoCount3m ?? 0}</span></div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-bold">受託</span>
                </div>
                <div className="text-xs text-muted-foreground font-bold">成約 <span className="text-lg text-foreground">{companyInfo?.truckCount1m ?? 0}</span></div>
                <div className="text-xs text-muted-foreground font-bold">登録 <span className="text-lg text-foreground">{companyInfo?.truckCount3m ?? 0}</span></div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground font-bold text-right mt-2">
              KEI MATCH登録年月 {companyInfo?.registrationDate || "-"}
            </div>
          </Card>

          <h4 className="text-sm font-bold text-foreground">基本情報</h4>
          <div className="border border-border rounded-md overflow-hidden">
            <DetailRow label="法人名・事業者名">
              <div>
                {companyInfo?.companyNameKana && (
                  <div className="text-[10px] text-muted-foreground mb-0.5">{companyInfo.companyNameKana}</div>
                )}
                <div className="text-primary font-bold">{companyInfo?.companyName || listing.companyName}</div>
              </div>
            </DetailRow>
            <DetailRow label="住所" value={companyInfo?.postalCode ? `〒${companyInfo.postalCode}\n${companyInfo.address || "-"}` : companyInfo?.address} />
            <DetailRow label="電話番号" value={listing.contactPhone} />
            <DetailRow label="FAX番号" value={companyInfo?.fax} />
            <DetailRow label="請求事業者登録番号" value={companyInfo?.invoiceRegistrationNumber} />
            <DetailRow label="業務内容・会社PR" value={companyInfo?.businessDescription} />
            <DetailRow label="保有車両台数" value={companyInfo?.truckCount ? `${companyInfo.truckCount} 台` : "-"} />
            <DetailRow label="ウェブサイトURL" value={companyInfo?.websiteUrl} />
            <DetailRow label="登録年月" value={companyInfo?.registrationDate} />
          </div>

          <h4 className="text-sm font-bold text-foreground">詳細情報</h4>
          <div className="border border-border rounded-md overflow-hidden">
            <DetailRow label="代表者" value={companyInfo?.representative} />
            <DetailRow label="設立" value={companyInfo?.establishedDate} />
            <DetailRow label="資本金" value={companyInfo?.capital ? `${companyInfo.capital} 万円` : null} />
            <DetailRow label="従業員数" value={companyInfo?.employeeCount} />
            <DetailRow label="事業所所在地" value={companyInfo?.officeLocations} />
            <DetailRow label="年間売上" value={companyInfo?.annualRevenue ? `${companyInfo.annualRevenue} 万円` : null} />
            <DetailRow label="取引先銀行" value={companyInfo?.bankInfo} />
            <DetailRow label="主要取引先" value={companyInfo?.majorClients} />
            <DetailRow label="締め日" value={[companyInfo?.closingMonth, companyInfo?.closingDay].filter(Boolean).join(" ") || null} />
            <DetailRow label="支払月・支払日" value={[companyInfo?.paymentMonth, companyInfo?.paymentDay].filter(Boolean).join(" ") || null} />
            <DetailRow label="営業地域" value={companyInfo?.businessArea} />
          </div>

          <h4 className="text-sm font-bold text-foreground">信用情報</h4>
          <div className="border border-border rounded-md overflow-hidden">
            <DetailRow label="加入組織" value={companyInfo?.memberOrganization} />
            <DetailRow label="国交省認可番号" value={companyInfo?.transportLicenseNumber} />
            <DetailRow label="デジタコ搭載数" value={companyInfo?.digitalTachographCount} />
            <DetailRow label="GPS搭載数" value={companyInfo?.gpsCount} />
            <DetailRow label="安全性優良事業所" value={companyInfo?.safetyExcellenceCert || "無"} />
            <DetailRow label="グリーン経営認証" value={companyInfo?.greenManagementCert || "無"} />
            <DetailRow label="ISO9000" value={companyInfo?.iso9000 || "無"} />
            <DetailRow label="ISO14000" value={companyInfo?.iso14000 || "無"} />
            <DetailRow label="ISO39001" value={companyInfo?.iso39001 || "無"} />
            <DetailRow label="荷物保険" value={companyInfo?.cargoInsurance} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyCargo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCargoId, setSelectedCargoId] = useState<string | null>(null);
  const [panelDefaultTab, setPanelDefaultTab] = useState<"cargo" | "company" | "edit">("cargo");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "departDate" | "arriveDate" | "price">("newest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allCargo, isLoading } = useQuery<CargoListing[]>({
    queryKey: ["/api/my-cargo"],
  });

  const myCargo = allCargo ?? [];

  const filtered = useMemo(() => {
    let result = [...myCargo].filter((c) => c.status !== "completed");

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) =>
        (c.cargoNumber && String(c.cargoNumber).includes(q)) ||
        c.departureArea.toLowerCase().includes(q) ||
        (c.departureAddress || "").toLowerCase().includes(q) ||
        c.arrivalArea.toLowerCase().includes(q) ||
        (c.arrivalAddress || "").toLowerCase().includes(q) ||
        c.cargoType.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        (c.privateNote || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "departDate": {
          const dA = a.desiredDate || "";
          const dB = b.desiredDate || "";
          return dA.localeCompare(dB) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        case "arriveDate": {
          const aA = a.arrivalDate || "";
          const aB = b.arrivalDate || "";
          return aA.localeCompare(aB) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        case "price": {
          const pA = parseInt(a.price?.replace(/[^0-9]/g, "") || "0");
          const pB = parseInt(b.price?.replace(/[^0-9]/g, "") || "0");
          return pB - pA;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [myCargo, statusFilter, sortBy, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const selectedCargo = useMemo(() => {
    if (!selectedCargoId || !allCargo) return null;
    return allCargo.find((l) => l.id === selectedCargoId) || null;
  }, [selectedCargoId, allCargo]);

  const deleteCargo = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cargo/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-cargo"] });
      toast({ title: "荷物情報を削除しました" });
      if (selectedCargoId) setSelectedCargoId(null);
    },
  });


  const statusCounts = useMemo(() => {
    const nonCompleted = myCargo.filter((c) => c.status !== "completed");
    const counts = { all: nonCompleted.length, active: 0, cancelled: 0 };
    nonCompleted.forEach((c) => {
      if (c.status === "active") counts.active++;
      else if (c.status === "cancelled") counts.cancelled++;
    });
    return counts;
  }, [myCargo]);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allPageChecked = paginated.length > 0 && paginated.every((c) => checkedIds.has(c.id));

  const toggleAllPage = () => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (allPageChecked) {
        paginated.forEach((c) => next.delete(c.id));
      } else {
        paginated.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const exportCsv = () => {
    const targets = filtered.filter((c) => checkedIds.has(c.id));
    if (targets.length === 0) {
      toast({ title: "エクスポートする荷物を選択してください", variant: "destructive" });
      return;
    }

    const headers = [
      "No", "管理番号", "状態", "形態", "発地", "発地住所", "発日", "発時間",
      "着地", "着地住所", "着日", "着時間",
      "荷種", "重量", "車種", "車体タイプ", "温度帯",
      "運賃", "高速代", "税区分", "積合", "ドライバー作業",
      "個数", "積込方法", "車両スペック", "必要装備",
      "積込時間", "降ろし時間", "支払日", "台数",
      "引越し", "緊急度", "備考",
      "会社名", "担当者", "電話番号", "メール", "登録日",
    ];

    const statusLabel = (s: string) => s === "active" ? "掲載中" : s === "completed" ? "成約" : s === "cancelled" ? "不成約" : s;

    const rows = targets.map((c, i) => [
      String(i + 1),
      c.cargoNumber ? String(c.cargoNumber) : "",
      statusLabel(c.status),
      c.transportType || "",
      c.departureArea,
      c.departureAddress || "",
      c.desiredDate,
      c.departureTime || "",
      c.arrivalArea,
      c.arrivalAddress || "",
      c.arrivalDate || "",
      c.arrivalTime || "",
      c.cargoType,
      c.weight,
      c.vehicleType,
      c.bodyType || "",
      c.temperatureControl || "",
      c.price || "",
      c.highwayFee || "",
      c.taxType || "",
      c.consolidation || "",
      c.driverWork || "",
      c.packageCount || "",
      c.loadingMethod || "",
      c.vehicleSpec || "",
      c.equipment || "",
      c.loadingTime || "",
      c.unloadingTime || "",
      c.paymentDate || "",
      c.truckCount || "",
      c.movingJob || "",
      c.urgency || "",
      (c.description || "").replace(/\n/g, " "),
      c.companyName,
      c.contactPerson || "",
      c.contactPhone,
      c.contactEmail || "",
      new Date(c.createdAt).toLocaleDateString("ja-JP"),
    ]);

    const escape = (v: string) => {
      if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        return '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    };

    const bom = "\uFEFF";
    const csv = bom + [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `荷物一覧_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: `${targets.length}件のCSVをダウンロードしました` });
  };

  return (
    <DashboardLayout>
      <div className="flex h-full">
        <div className={`flex-1 overflow-y-auto transition-all duration-300`}>
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">登録した荷物</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  自分が登録した荷物情報の一覧
                </p>
              </div>
              <div className="flex items-center gap-2">
                {checkedIds.size > 0 && (
                  <span className="text-xs text-muted-foreground font-bold">{checkedIds.size}件選択中</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={exportCsv}
                  disabled={checkedIds.size === 0}
                  data-testid="button-export-csv"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV出力
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              {STATUS_FILTERS.map((f) => (
                <Badge
                  key={f.value}
                  variant={statusFilter === f.value ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => { setStatusFilter(f.value); setPage(1); }}
                  data-testid={`filter-status-${f.value}`}
                >
                  {f.label} ({statusCounts[f.value as keyof typeof statusCounts]})
                </Badge>
              ))}
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="管理番号・発着地・荷種・メモで検索..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-search-cargo"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm" data-testid="text-result-count">
                  {filtered.length} 件
                </span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[140px] text-xs h-8" data-testid="select-sort">
                    <ArrowUpDown className="w-3 h-3 mr-1 shrink-0 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">新着順</SelectItem>
                    <SelectItem value="departDate">発日時</SelectItem>
                    <SelectItem value="arriveDate">着日時</SelectItem>
                    <SelectItem value="price">運賃</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-auto text-xs" data-testid="select-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PER_PAGE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}件/ページ</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-my-cargo">
                  <thead>
                    <tr className="border-b bg-muted/60">
                      <th className="text-center px-2 py-2.5">
                        <input
                          type="checkbox"
                          checked={allPageChecked}
                          onChange={toggleAllPage}
                          className="w-3.5 h-3.5 accent-primary cursor-pointer"
                          data-testid="checkbox-select-all"
                        />
                      </th>
                      <th className="text-center px-2 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">管理No</th>
                      <th className="text-center px-2 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">状態</th>
                      <th className="text-center px-2 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">形態</th>
                      <th className="text-left px-2 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap min-w-[220px]">発着情報</th>
                      <th className="text-right px-2 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">運賃</th>
                      <th className="text-center px-1.5 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">重量</th>
                      <th className="text-center px-1.5 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">車種</th>
                      <th className="text-left px-2 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">荷種</th>
                      <th className="text-center px-1.5 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">閲覧</th>
                      <th className="text-center px-2 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading && Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-2 py-3"><Skeleton className="h-4 w-4" /></td>
                        <td className="px-2 py-3"><Skeleton className="h-4 w-8" /></td>
                        <td className="px-2 py-3"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-2 py-3"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-2 py-3"><Skeleton className="h-10 w-48" /></td>
                        <td className="px-2 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-1.5 py-3"><Skeleton className="h-4 w-10" /></td>
                        <td className="px-1.5 py-3"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-2 py-3"><Skeleton className="h-4 w-14" /></td>
                        <td className="px-1.5 py-3"><Skeleton className="h-4 w-8" /></td>
                        <td className="px-2 py-3"><Skeleton className="h-4 w-20" /></td>
                      </tr>
                    ))}

                    {!isLoading && paginated.map((listing, index) => {
                      const daysAgo = Math.floor((Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                      const timeLabel = daysAgo === 0 ? "今日" : daysAgo === 1 ? "昨日" : `${daysAgo}日前`;

                      return (
                        <tr
                          key={listing.id}
                          className={`hover-elevate cursor-pointer transition-colors ${index % 2 === 1 ? "bg-muted/20" : ""} ${selectedCargoId === listing.id ? "bg-primary/10" : ""}`}
                          onClick={() => { setSelectedCargoId(listing.id); setPanelDefaultTab("cargo"); }}
                          data-testid={`row-my-cargo-${listing.id}`}
                        >
                          <td className="px-2 py-3 text-center align-top" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checkedIds.has(listing.id)}
                              onChange={() => toggleCheck(listing.id)}
                              className="w-3.5 h-3.5 accent-primary cursor-pointer"
                              data-testid={`checkbox-cargo-${listing.id}`}
                            />
                          </td>
                          <td className="px-2 py-3 text-center align-top">
                            <span className="text-[11px] font-bold text-muted-foreground">{listing.cargoNumber || "-"}</span>
                          </td>
                          <td className="px-2 py-3 text-center align-top">
                            {listing.status === "active" ? (
                              <Badge variant="outline" className="text-[10px] px-1 border-green-300 text-green-600">
                                <CircleDot className="w-2.5 h-2.5 mr-0.5" />掲載中
                              </Badge>
                            ) : listing.status === "completed" ? (
                              <Badge variant="outline" className="text-[10px] px-1 border-orange-300 text-orange-600">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />成約
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1 border-red-300 text-red-600">
                                <XCircle className="w-2.5 h-2.5 mr-0.5" />不成約
                              </Badge>
                            )}
                          </td>
                          <td className="px-2 py-3 text-center align-top">
                            {listing.transportType ? (
                              <Badge variant="outline" className="text-[10px] px-1 text-foreground">{listing.transportType}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground font-bold">-</span>
                            )}
                          </td>
                          <td className="px-2 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <div className="flex items-start gap-1 min-w-0 w-[140px] shrink-0">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-bold text-[12px] text-foreground">{listing.departureArea}</span>
                                    {listing.departureAddress && (
                                      <span className="text-[11px] text-muted-foreground font-bold">{listing.departureAddress}</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-bold">
                                    {listing.desiredDate} {listing.departureTime && listing.departureTime !== "指定なし" ? listing.departureTime : ""}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <div className="flex items-start gap-1 min-w-0">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-bold text-[12px] text-foreground">{listing.arrivalArea}</span>
                                    {listing.arrivalAddress && (
                                      <span className="text-[11px] text-muted-foreground font-bold">{listing.arrivalAddress}</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-bold">
                                    {listing.arrivalDate || ""} {listing.arrivalTime && listing.arrivalTime !== "指定なし" ? listing.arrivalTime : ""}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-right align-top">
                            <div className="font-bold text-[13px] text-foreground whitespace-nowrap">
                              {listing.price ? `¥${formatPrice(listing.price)}` : "要相談"}
                            </div>
                            <div className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 font-bold">
                              高速代: {listing.highwayFee || "未設定"}
                            </div>
                          </td>
                          <td className="px-1.5 py-3 text-center align-top">
                            <span className="whitespace-nowrap text-[12px] font-bold">{listing.weight}</span>
                          </td>
                          <td className="px-1.5 py-3 text-center align-top">
                            <div className="text-[12px] whitespace-nowrap font-bold">{listing.vehicleType}</div>
                            {listing.bodyType && (
                              <div className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 font-bold">{listing.bodyType}</div>
                            )}
                          </td>
                          <td className="px-2 py-3 align-top">
                            <span className="whitespace-nowrap text-[12px] font-bold">{listing.cargoType}</span>
                            {listing.temperatureControl && listing.temperatureControl !== "指定なし" && listing.temperatureControl !== "常温" && (
                              <div className="mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1">{listing.temperatureControl}</Badge>
                              </div>
                            )}
                          </td>
                          <td className="px-1.5 py-3 text-center align-top">
                            <div className="flex items-center justify-center gap-0.5">
                              <Eye className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground font-bold">{listing.viewCount ?? 0}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{timeLabel}</div>
                            {listing.privateNote && (
                              <div className="flex items-center justify-center gap-0.5 mt-0.5" title={listing.privateNote}>
                                <FileText className="w-3 h-3 text-amber-500" />
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-6 px-2"
                                data-testid={`button-edit-${listing.id}`}
                                onClick={(e) => { e.stopPropagation(); setSelectedCargoId(listing.id); setPanelDefaultTab("edit"); }}
                              >
                                <Pencil className="w-3 h-3 mr-0.5" />編集
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[10px] h-6 px-2 text-destructive"
                                onClick={() => deleteCargo.mutate(listing.id)}
                                disabled={deleteCargo.isPending}
                                data-testid={`button-delete-${listing.id}`}
                              >
                                <Trash2 className="w-3 h-3 mr-0.5" />削除
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!isLoading && paginated.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-16">
                          <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                          <p className="font-medium text-muted-foreground" data-testid="text-empty-state">
                            {statusFilter === "all" ? "登録した荷物はありません" :
                             statusFilter === "active" ? "掲載中の荷物はありません" :
                             "不成約の荷物はありません"}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-2 flex-wrap mt-4">
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-auto text-xs" data-testid="select-per-page-bottom">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PER_PAGE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}件/ページ</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        </div>
        {selectedCargoId && selectedCargo && (
          <CargoDetailPanel listing={selectedCargo} onClose={() => setSelectedCargoId(null)} defaultTab={panelDefaultTab} />
        )}
      </div>
    </DashboardLayout>
  );
}
