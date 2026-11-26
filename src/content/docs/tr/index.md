---
title: nomux dokümantasyonu
description: Native bir agentic geliştirme ortamı olan nomux'un dokümantasyonu.
template: splash
hero:
  tagline: Native bir agentic geliştirme ortamı. İstemci koptuğunda session'lar host'ta yaşamaya devam eder.
  actions:
    - text: Hızlı başlangıç
      link: /docs/tr/guides/quick-start/
      icon: right-arrow
    - text: Kavramları oku
      link: /docs/tr/concepts/overview/
      variant: minimal
---

## Durum

nomux geliştirme aşamasında. 1.0.0 öncesindeki sürümler ön sürümdür: minor sürümler arasında API, CLI ve protokol değişebilir.

Güncel sürüm [nomux 0.4.0](https://github.com/nomux-sh/nomux/releases/tag/v0.4.0).
CLI ile Session açabilir, listeleyebilir ve sonlandırabilir, terminalinizle bir Session'a attach ve detach olabilirsiniz. Siz detach olsanız da daemon dursa da Session çalışmaya devam eder. Host yeniden başladığında Session uykuya geçer; istediğinizde önceki çıktısıyla birlikte yeniden başlar.
CLI ayrıca SSH ile uzak Host'ları kullanır, extension kurar ve çağırır.
nomux 0.4.0, her Session'da neyin çalıştığını, neyin bittiğini ve neyin sizi beklediğini, her durumun kaynağıyla birlikte gösterir. Her Session'ın belleğini de gösterir ve yeni Session'lar için hazır holder'lar tutar.
Henüz yapılmadı: desktop istemcisi, Proje grupları, Session için bellek limiti ve boşta duran agent'ların hazırda bekletilmesi.
Homebrew, kurulum script'i ve binary'leri edinmenin diğer yolları [kurulum sayfasında](/docs/tr/guides/install/).

Sırada ne olduğunu yalnızca [yol haritası](/docs/tr/project/roadmap/) söyler.
Bu site ürünle birlikte büyür; bir sayfa ancak içeriği hazır olunca eklenir.

## nomux'u kullanmak

- [Kurulum](/docs/tr/guides/install/) sayfası binary'leri nasıl edineceğinizi, nereye kurulduklarını ve nasıl kaldırılacaklarını anlatır.
- [Hızlı başlangıç](/docs/tr/guides/quick-start/) bir Session açar, ona attach ve detach olur, daemon'u durdurur, Session'ın yaşamaya devam ettiğini gösterir ve çıktısını okur.
- [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) uykudaki Session'ları, geri yükleme politikalarını ve daemon'un oturum açılışında başlatılmasını gösterir.
- [Uzak Host'lar](/docs/tr/guides/remote-hosts/) bir sunucuyu SSH ile ekler ve Session'larını kullanır.
- [Agent durumu](/docs/tr/guides/agent-status/) her Session'da neyin çalıştığını, neyin bittiğini ve neyin sizi beklediğini, nedeniyle birlikte gösterir.
- [Agent adapter'ları ve hook'lar](/docs/tr/guides/agent-adapters/) bir agent aracının durumunu bildirmesini sağlar; nomux bir ayar dosyasına yazmadan önce diff gösterir. [Claude Code adapter'ı](/docs/tr/guides/claude-code/) ilk adapter'dır.
- [Session'ların belleği](/docs/tr/guides/session-memory/) her Session'ın ne kadar bellek kullandığını gösterir.
- [Holder havuzu](/docs/tr/guides/holder-pool/), [Session'ın ortamı](/docs/tr/guides/session-environment/) ve [Uzun home dizinleri](/docs/tr/guides/long-home-paths/) yeni bir Session'ın nasıl hızlı açıldığını, hangi değişkenleri aldığını ve nomux'un uzun bir home dizininde ne yaptığını anlatır.
- [Extension'lar](/docs/tr/guides/extensions/) bir extension'ı onayladığınız izinlerle kurar ve çağırır. [Extension yazmak](/docs/tr/guides/write-an-extension/) bir extension'ı Rust, TypeScript ya da Go ile nasıl yazacağınızı anlatır.
- [CLI başvurusu](/docs/tr/reference/cli/) her komutu, JSON çıktısını ve çıkış kodlarını verir.

## nomux'u anlamak

- [Kavramlar](/docs/tr/concepts/overview/) sayfası nomux'un ne olduğunu ve parçalarının nasıl bir araya geldiğini anlatır.
- [Nasıl çalışır](/docs/tr/concepts/how-it-works/) sayfası üç process'i, attach sırasında olanları, daemon durduğunda Session'ın neden yaşadığını ve yeniden başlatmadan sonra diskte nelerin kaldığını anlatır.
- [Extension'lar](/docs/tr/concepts/extensions/) sayfası extension'ın ne olduğunu, daemon'un onunla ne yaptığını ve extension SDK'sında neler bulunduğunu anlatır.
- [Performans hedefleri](/docs/tr/reference/performance/) hedefleri ve bugüne kadar ölçülen değerleri listeler.
- [Sözlük](/docs/tr/reference/glossary/) her kavramın tek adını verir. Kod, CLI ve arayüz aynı adları kullanır.
- [Mimari kararlar](/docs/tr/reference/decisions/) sayfası karar kayıtlarının nerede durduğunu ve bir kararın nasıl değiştiğini anlatır.

## Takip etmek ve katkıda bulunmak

- [Yol haritası](/docs/tr/project/roadmap/) işlerin sırasını ve her aşamanın durumunu gösterir.
- [Katkıda bulunma](/docs/tr/project/contributing/) sayfası organizasyonun rehberlerine bağlantı verir ve hangi parçanın hangi repoda olduğunu gösterir.

## Diller

Site İngilizce ve Türkçe yayınlanır. Dil menüsünden istediğinize geçebilirsiniz.

## Lisans

Dokümantasyon [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.tr) ile lisanslıdır.
nomux'un kodu `MIT OR Apache-2.0` ile lisanslıdır.
