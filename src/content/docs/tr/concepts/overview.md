---
title: Kavramlara genel bakış
description: nomux nedir, çekirdekte ne vardır ve parçalar nasıl bir araya gelir.
sidebar:
  label: Genel bakış
---

nomux native bir agentic geliştirme ortamıdır.
Siz bir Görev açarsınız; nomux o Göreve bir Worktree ile bir agent Session'ı bağlar, işi de agent yapar.
Her Agent çalışmasını ve her Alt işi durumuyla birlikte görürsünüz. Değişiklikleri diff'te inceler, onaylar ve commit'lersiniz.

Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.

## Üç temel fikir

**Session, Host'ta yaşar.**
Her Session'ın PTY'sini küçük bir holder process'i tutar.
Laptop'u kapatsanız, bağlantı kopsa ya da daemon dursa bile terminal ve agent çalışmaya devam eder.
İstemci dediğimiz şey, bağlanıp kopan bir pencereden ibarettir: desktop uygulaması, CLI ya da mobil uygulama.

**Çekirdek neredeyse boştur. Her özellik bir extension'dır.**
Git, dosyalar, agent adapter'ları, browser, bildirim kanalları, programlama dili desteği, temalar ve arayüz dilleri birer extension'dır.
Hepsini tek tek kurup kaldırabilirsiniz. Kullanmadığınız extension hiç yüklenmez.

**Her durumun kaynağı bellidir.**
nomux bir agent'ın durumunu adapter event'lerinden, OSC 7501 terminal dizisinden, agent'ın kendi bildiriminden ya da son çare olarak bir yedek kaynaktan okur.
Durumu, geldiği kaynakla birlikte saklar. Tahmine dayanan bir değeri kesinmiş gibi göstermez.

## Çekirdekte ne var

- Host'lar ve taşıma: local, SSH ve doğrudan bağlantı. Her Host'ta bir `nomuxd`, her Session için bir `nomux-holder` çalışır.
- Veri modeli: Host, Proje, Worktree, Session, Agent çalışması, Alt iş, Takım ve Görev.
- Daemon durduğunda ya da güncellendiğinde de devam eden kalıcı terminal Session'ları.
- Çalışma alanı: Pane ağacı, her Pane'de bir Tab yığını ve yeni türlerin eklenebildiği bir içerik türü registry'si.
- Agent durum motoru: durum kaynaklarının sırası, Alt iş ağacı ve dikkat sinyalleri.
- Takım Tab'ı ve mesaj kutuları. Orkestrasyonu nomux değil, agent'lar kendileri yapar.
- Extension host'ları, tema motoru ve arayüz dili motoru.
- İstemciler: CLI, desktop uygulaması ve mobil uygulamalar.

## Parçalar nasıl bağlanır

```text
[Desktop]   [CLI]   [Mobil]
     \        |        /
      SSH ya da QUIC üzerinden nomux protokolü
              |
           nomuxd (her Host'ta bir tane)
           /                    \
 nomux-holder (her Session   extension'lar (ayrı
 için bir tane; PTY'yi       process'ler, ihtiyaç
 tutar)                      anında başlar)
```

Bütün istemciler tek bir protokol kullanır.
İstemcinin kopması hiçbir process'i durdurmaz. Daemon'un durması da hiçbir process'i durdurmaz.

## Platformlar

Host, Linux ya da macOS üzerinde çalışır. Windows'ta Host, WSL içinde çalışır.
İstemciler Linux, macOS ve Windows'ta çalışır. Mobil istemciler iOS ve Android'de çalışır.

## nomux'un yapmadıkları

- Çekirdek hiçbir programlama dilini tanımaz. Dil desteğini dil extension'ları getirir.
- nomux'ta hesap, cloud servisi ve telemetri yoktur.
- nomux tmux'a bağımlı değildir, tmux komutlarını da taklit etmez.
- nomux hiçbir agent'ı izin istemlerini atlayan flag'lerle başlatmaz.

## Durum

nomux geliştirme aşamasında. 1.0.0 öncesindeki sürümler ön sürümdür: minor sürümler arasında API, CLI ve protokol değişebilir.
Bugün hangi parçaların hazır olduğunu [yol haritası](/docs/tr/project/roadmap/) gösterir.
Temel tasarım tercihlerinin gerekçeleri [mimari kararlar](/docs/tr/reference/decisions/) sayfasından başlayarak okunabilir.
