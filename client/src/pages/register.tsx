import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Upload, FileText, X, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@assets/logo.png";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [permitFile, setPermitFile] = useState<{ filePath: string; fileName: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    companyName: "",
    address: "",
    contactName: "",
    phone: "",
    fax: "",
    truckCount: "",
  });

  const { data: lineConfig } = useQuery<{ basicId: string; configured: boolean }>({
    queryKey: ["/api/public/line-config"],
  });

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/home");
    }
  }, [isAuthenticated, setLocation]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("permit", file);
      const res = await fetch("/api/upload/permit", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const data = await res.json();
      setPermitFile(data);
      toast({ title: "アップロード完了", description: "許可証がアップロードされました" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "アップロード失敗", description: error.message || "ファイルのアップロードに失敗しました" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({
        variant: "destructive",
        title: "確認",
        description: "利用規約・プライバシーポリシーに同意してください",
      });
      return;
    }
    try {
      await register.mutateAsync({ ...form, permitFile: permitFile?.filePath || "" });
      setRegistered(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "登録失敗",
        description: error.message || "登録に失敗しました",
      });
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const lineAddUrl = lineConfig?.basicId
    ? `https://line.me/R/ti/p/${lineConfig.basicId.startsWith("@") ? lineConfig.basicId : "@" + lineConfig.basicId}`
    : null;

  if (registered) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={logoImage} alt="KEI MATCH" className="h-10 w-auto" />
            </div>
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl">登録完了！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">承認待ち</p>
                <p className="text-sm text-amber-700 mt-1">
                  管理者が申請内容を確認中です。通常1営業日以内に承認メールをお送りします。
                </p>
              </div>
            </div>

            {lineAddUrl && (
              <div className="bg-[#06C755]/5 border border-[#06C755]/30 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">📣 承認通知をLINEで受け取る</p>
                <p className="text-sm text-muted-foreground">
                  公式LINEを友だち追加すると、承認が完了次第LINEでもお知らせします。
                  また新着案件・空き車両情報もリアルタイムで届きます。
                </p>
                <a
                  href={lineAddUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="button-line-add"
                  className="flex items-center justify-center gap-2 w-full bg-[#06C755] hover:bg-[#05a847] text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  公式LINEを友だち追加する
                </a>
                <p className="text-xs text-muted-foreground text-center">
                  追加後、登録メールアドレスを送信するとアカウント連携が完了します
                </p>
              </div>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">承認メールが届いたらログインできます</p>
              <Link href="/login">
                <Button variant="outline" className="w-full" data-testid="button-go-to-login">
                  ログインページへ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoImage} alt="KEI MATCH" className="h-10 w-auto" />
          </div>
          <CardTitle className="text-2xl">新規登録</CardTitle>
          <p className="text-sm text-muted-foreground">KEI MATCHのアカウントを作成</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="info@example.co.jp"
                required
                data-testid="input-register-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="パスワード"
                required
                data-testid="input-register-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">会社名</Label>
              <Input
                id="companyName"
                type="text"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                placeholder="例: 〇〇運送 / 個人事業主名"
                required
                data-testid="input-register-company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">所在地</Label>
              <Input
                id="address"
                type="text"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="例: 神奈川県横浜市中区1-2-3"
                data-testid="input-register-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">担当者名</Label>
              <Input
                id="contactName"
                type="text"
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                placeholder="例: 山田 太郎"
                data-testid="input-register-contact-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="03-0000-0000"
                  required
                  data-testid="input-register-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fax">FAX番号</Label>
                <Input
                  id="fax"
                  type="tel"
                  value={form.fax}
                  onChange={(e) => update("fax", e.target.value)}
                  placeholder="03-0000-0001"
                  data-testid="input-register-fax"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="truckCount">車両保有台数</Label>
              <Input
                id="truckCount"
                type="text"
                value={form.truckCount}
                onChange={(e) => update("truckCount", e.target.value)}
                placeholder="例: 10台"
                data-testid="input-register-truck-count"
              />
            </div>
            <div className="space-y-2">
              <Label>貨物軽自動車運送事業届出書</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-permit-file"
              />
              {permitFile ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm truncate flex-1" data-testid="text-permit-filename">{permitFile.fileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => { setPermitFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    data-testid="button-remove-permit"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="button-upload-permit"
                >
                  {uploading ? "アップロード中..." : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      許可証をアップロード
                    </>
                  )}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PDF、JPG、PNG形式（最大10MB）</p>
            </div>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                data-testid="checkbox-agree"
              />
              <Label htmlFor="agree" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                <span className="text-primary font-medium">利用規約</span>、<span className="text-primary font-medium">プライバシーポリシー</span>に同意する
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={register.isPending || !agreed}
              data-testid="button-register-submit"
            >
              {register.isPending ? "登録中..." : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  同意して登録する
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            既にアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-primary font-medium" data-testid="link-to-login">
              ログイン
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
