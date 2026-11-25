---
title: Kavramlara genel bakış
description: nomux nedir, çekirdekte ne vardır ve parçalar nasıl bir araya gelir.
sidebar:
  label: Genel bakış
---

nomux native bir agentic geliştirme ortamıdır.
Bir Görev açarsınız. nomux bu Göreve bir Worktree ve bir agent Session'ı bağlar. İşi agent yapar.
Her Agent çalışmasını ve her Alt işi durumuyla birlikte görürsünüz. Değişiklikleri diff üzerinden inceler, onaylar ve commit'lersiniz.

Bu sayfadaki terimler [Sözlük](/tr/reference/glossary/) sayfasından gelir.

## Üç temel fikir

**Session, Host'ta yaşar.**
Her Session'ın PTY'sini küçük bir holder process'i tutar.
Laptop'u kapatsanız, bağlantı kopsa ya da daemon dursa bile terminal ve agent çalışmaya devam eder.
İstemci, bağlanıp kopan bir penceredir. İstemciler desktop uygulaması, CLI ve mobil uygulamadır.

**Çekirdek neredeyse boştur. Her özellik bir extension'dır.**
Git, dosyalar, agent adapter'ları, browser, bildirim kanalları, programlama dili desteği, temalar ve arayüz dilleri birer extension'dır.
Her birini kurabilir ve kaldırabilirsiniz. Kullanmadığınız extension yüklenmez.

**Her durumun kaynağı bellidir.**
nomux bir agent'ın durumunu adapter olaylarından, OSC 7501 terminal dizisinden, self-report'tan ya da bir yedek kaynaktan okur.
Kaynağı durumla birlikte saklar. Tahmin edilen bir değeri kesinmiş gibi göstermez.

## Çekirdekte ne var

- Host'lar ve taşıma: local, SSH ve doğrudan bağlantı. Her Host'ta bir `nomuxd`, her Session için bir `nomux-holder` çalışır.
- Veri modeli: Host, Proje, Worktree, Session, Agent çalışması, Alt iş, Takım ve Görev.
- Daemon durduğunda ya da güncellendiğinde de devam eden kalıcı terminal Session'ları.
- Çalışma alanı: Pane ağacı, her Pane'de bir Tab yığını ve açık bir içerik türleri registry'si.
- Agent durum motoru: durum kaynaklarının sırası, Alt iş ağacı ve dikkat sinyalleri.
- Takım Tab'ı ve mesaj kutuları. Orkestrasyonu agent'ların kendisi yapar.
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

- Çekirdekte dil zekâsı yoktur. Bunu dil extension'ları sağlar.
- nomux'ta hesap, cloud servisi ve telemetri yoktur.
- nomux tmux'a bağımlı değildir ve tmux komutlarını taklit etmez.
- nomux hiçbir agent'ı izin sorularını atlayan bayraklarla başlatmaz.

## Durum

nomux geliştirme aşamasında. Henüz yayınlanmış bir sürümü yok.
Temel tasarım tercihleri [mimari kararlar](/tr/reference/decisions/) sayfasında kayıtlıdır.
