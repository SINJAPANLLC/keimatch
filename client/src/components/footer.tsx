import { Link } from "wouter";
import logoImage from "@assets/logo.png";
import { SiX, SiInstagram, SiYoutube, SiTiktok, SiFacebook, SiLine, SiAppstore } from "react-icons/si";

const SNS_LINKS = [
  { href: "https://x.com/keimatch_sj", icon: SiX, label: "X (Twitter)" },
  { href: "https://www.instagram.com/keimatch_sinjapan/", icon: SiInstagram, label: "Instagram" },
  { href: "https://www.youtube.com/@keimatch-sinjapan", icon: SiYoutube, label: "YouTube" },
  { href: "https://www.tiktok.com/@keimatch_sinjapan", icon: SiTiktok, label: "TikTok" },
  { href: "https://www.facebook.com/keimatch.sinjapan", icon: SiFacebook, label: "Facebook" },
  { href: "https://line.me/R/ti/p/@684fhwyj", icon: SiLine, label: "LINE公式" },
];

export default function Footer() {
  return (
    <footer className="bg-primary mt-auto text-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:flex-1">
            <div className="flex items-center mb-4">
              <img src={logoImage} alt="KEI MATCH" className="h-10 w-auto brightness-0 invert" />
            </div>
            <p className="text-base text-primary-foreground leading-relaxed mb-4">
              軽貨物事業者をつなぐ、軽貨物マッチングサービス
            </p>
            <div className="text-sm text-primary-foreground space-y-1">
              <p className="font-semibold">合同会社SIN JAPAN</p>
              <p>〒243-0303</p>
              <p>神奈川県愛甲郡愛川町中津7287</p>
              <p>TEL 046-212-2325</p>
              <p>FAX 046-212-2326</p>
              <p>Mail info@sinjapan.jp</p>
            </div>
          </div>
          <div className="flex gap-8 sm:gap-16 md:gap-20 md:self-end md:pb-2">
            <div>
              <h3 className="text-base font-semibold text-primary-foreground mb-3">サポート</h3>
              <ul className="space-y-2 text-base text-primary-foreground">
                <li><Link href="/guide" className="hover:underline" data-testid="link-guide">ご利用ガイド</Link></li>
                <li><Link href="/faq" className="hover:underline" data-testid="link-faq">よくある質問</Link></li>
                <li><Link href="/contact" className="hover:underline" data-testid="link-contact">お問い合わせ</Link></li>
                <li><Link href="/column" className="hover:underline" data-testid="link-columns">コラム記事</Link></li>
                <li><Link href="/kei-komi" className="hover:underline" data-testid="link-kei-komi">ケイコミ（口コミ）</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-primary-foreground mb-3">会社情報</h3>
              <ul className="space-y-2 text-base text-primary-foreground">
                <li><Link href="/company-info" className="hover:underline" data-testid="link-company-info">会社情報</Link></li>
                <li><Link href="/terms" className="hover:underline" data-testid="link-terms">利用規約</Link></li>
                <li><Link href="/privacy" className="hover:underline" data-testid="link-privacy">プライバシーポリシー</Link></li>
                <li><Link href="/agency" className="hover:underline" data-testid="link-agency">代理店申請</Link></li>
              </ul>
              <h3 className="text-base font-semibold text-primary-foreground mt-6 mb-3">関連サービス</h3>
              <ul className="space-y-2 text-base text-primary-foreground">
                <li><a href="https://keisaiyou-sinjapan.com" target="_blank" rel="noopener noreferrer" className="hover:underline" data-testid="link-keisaiyou">KEI SAIYOU</a></li>
                <li><a href="https://tramatch-sinjapan.com" target="_blank" rel="noopener noreferrer" className="hover:underline" data-testid="link-tramatch">TRA MATCH</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-primary-foreground/30">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {SNS_LINKS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  data-testid={`link-sns-${label.replace(/[^a-zA-Z]/g, "").toLowerCase()}`}
                  className="w-9 h-9 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/30 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </a>
              ))}
              <a
                href="https://apps.apple.com/jp/app/%E3%82%B1%E3%82%A4%E3%83%9E%E3%83%83%E3%83%81/id6760977063"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="App Store"
                data-testid="link-appstore"
                className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/30 transition-colors"
              >
                <SiAppstore className="w-4 h-4 text-primary-foreground" />
                <span className="text-xs font-medium text-primary-foreground whitespace-nowrap">App Store</span>
              </a>
            </div>
            <p className="text-base text-primary-foreground text-center">
              &copy; 2026 SIN JAPAN LLC All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
