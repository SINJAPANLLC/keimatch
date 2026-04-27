import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Building2, TrendingUp, Users, Handshake, ChevronRight } from "lucide-react";

const agencySchema = z.object({
  companyName: z.string().min(1, "会社名・屋号を入力してください"),
  representativeName: z.string().min(1, "担当者名を入力してください"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
  prefecture: z.string().min(1, "都道府県を入力してください"),
  businessType: z.string().min(1, "業種を入力してください"),
  motivation: z.string().min(10, "10文字以上入力してください"),
  message: z.string().optional(),
});

type AgencyFormData = z.infer<typeof agencySchema>;

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "紹介報酬",
    desc: "ご紹介いただいた事業者が成約するたびに報酬をお支払いします。",
  },
  {
    icon: Users,
    title: "専任サポート",
    desc: "代理店専用の担当者がフォローアップから契約手続きまで全面サポートします。",
  },
  {
    icon: Building2,
    title: "営業ツール提供",
    desc: "パンフレット・紹介動画・提案資料など営業に必要なツールを無料で提供します。",
  },
  {
    icon: Handshake,
    title: "共同プロモーション",
    desc: "SIN JAPANとの共同イベント・セミナー開催など、ビジネス拡大を一緒に支援します。",
  },
];

const STEPS = [
  { num: "01", title: "申請フォームを送信", desc: "下記フォームに必要事項を入力し送信してください。" },
  { num: "02", title: "審査・ご連絡", desc: "内容確認後、3営業日以内に担当者よりご連絡いたします。" },
  { num: "03", title: "契約締結", desc: "代理店契約書にご署名いただき、正式に契約完了となります。" },
  { num: "04", title: "活動開始", desc: "営業ツールをご提供し、代理店活動を開始いただけます。" },
];

export default function AgencyPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      companyName: "",
      representativeName: "",
      email: "",
      phone: "",
      prefecture: "",
      businessType: "",
      motivation: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AgencyFormData) => {
      const body = `【代理店申請】\n\n会社名・屋号: ${data.companyName}\n担当者名: ${data.representativeName}\nメール: ${data.email}\n電話番号: ${data.phone}\n都道府県: ${data.prefecture}\n業種: ${data.businessType}\n\n■ 申請動機・強み\n${data.motivation}\n\n■ その他メッセージ\n${data.message || "なし"}`;
      const res = await apiRequest("POST", "/api/contact", {
        name: data.representativeName,
        email: data.email,
        company: data.companyName,
        subject: "代理店申請",
        message: body,
      });
      if (!res.ok) throw new Error("送信に失敗しました");
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: () => {
      toast({ title: "送信に失敗しました", description: "しばらく後にもう一度お試しください。", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="bg-primary py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-primary-foreground/70 text-sm font-semibold tracking-widest uppercase mb-3">Agency Program</p>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              KEI MATCH 代理店プログラム
            </h1>
            <p className="text-primary-foreground/80 text-base md:text-lg leading-relaxed">
              軽貨物業界のネットワークをお持ちの方や、物流・運送事業に携わる企業様と<br className="hidden md:inline" />
              一緒にKEI MATCHを広めるパートナーを募集しています。
            </p>
          </div>
        </section>

        <section className="py-14 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-foreground mb-10">代理店特典</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="border-0 shadow-sm">
                  <CardContent className="pt-6 pb-5 px-5 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-foreground mb-10">申請から活動開始まで</h2>
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div key={step.num} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {step.num}
                  </div>
                  <div className="flex-1 pt-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{step.title}</h3>
                      {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 px-4 bg-muted/30">
          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-5" />
                <h2 className="text-2xl font-bold text-foreground mb-3">申請を受け付けました</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ご申請ありがとうございます。<br />
                  内容を確認のうえ、3営業日以内に担当者よりご連絡いたします。
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center text-foreground mb-2">代理店申請フォーム</h2>
                <p className="text-center text-muted-foreground text-sm mb-8">
                  必要事項を入力してお申し込みください。担当者よりご連絡いたします。
                </p>
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-6 pb-8 px-6 md:px-8">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <FormField control={form.control} name="companyName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>会社名・屋号 <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="合同会社〇〇" data-testid="input-company-name" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="representativeName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>担当者名 <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="山田 太郎" data-testid="input-representative-name" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                              <FormLabel>メールアドレス <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input type="email" placeholder="example@mail.com" data-testid="input-email" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>電話番号 <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="090-0000-0000" data-testid="input-phone" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <FormField control={form.control} name="prefecture" render={({ field }) => (
                            <FormItem>
                              <FormLabel>都道府県 <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="東京都" data-testid="input-prefecture" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="businessType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>業種 <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="軽貨物運送業・物流コンサルなど" data-testid="input-business-type" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="motivation" render={({ field }) => (
                          <FormItem>
                            <FormLabel>申請動機・強み <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Textarea
                                className="min-h-[120px]"
                                placeholder="代理店として活動したい理由や、お持ちのネットワーク・強みをご記入ください。"
                                data-testid="textarea-motivation"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="message" render={({ field }) => (
                          <FormItem>
                            <FormLabel>その他メッセージ（任意）</FormLabel>
                            <FormControl>
                              <Textarea
                                className="min-h-[80px]"
                                placeholder="ご質問・ご要望などあればご記入ください。"
                                data-testid="textarea-message"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={mutation.isPending}
                          data-testid="button-submit-agency"
                        >
                          {mutation.isPending ? "送信中..." : "申請する"}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          送信内容は<a href="/privacy" className="underline hover:text-foreground">プライバシーポリシー</a>に基づき適切に管理いたします。
                        </p>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
