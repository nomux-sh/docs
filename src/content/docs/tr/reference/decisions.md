---
title: Mimari kararlar
description: nomux mimari karar kayıtlarının (ADR) listesi ve her birinin durumu.
---

Mimari karar kaydı (ADR) tek bir tasarım kararını kaydeder: bağlam, karar, sonuçlar ve değerlendirilen alternatifler.
nomux mimarisinde yapılacak her değişiklik bir ADR ile başlar.

ADR dosyaları, `nomux-sh/docs` reposunun [`adr/` klasöründe](https://github.com/nomux-sh/docs/tree/main/adr) düz Markdown olarak durur.
ADR'ler yalnızca İngilizce yazılır.
Bu sayfa bir dizindir; ADR'lerin tam metnini göstermez.

## Kayıtlar

| ADR | Başlık | Durum | Tek cümleyle karar |
|---|---|---|---|
| [0001](https://github.com/nomux-sh/docs/blob/main/adr/0001-session-holder-model.md) | Session holder modeli | Kabul edildi | Her Session'ın PTY'sini ayrı bir holder process'i tutar; böylece daemon dursa da Session devam eder. |
| [0002](https://github.com/nomux-sh/docs/blob/main/adr/0002-protocol-protobuf-and-binary-frames.md) | Protokol: protobuf ve binary frame | Kabul edildi | Kontrol mesajları protobuf'tır. Terminal verisi sabit başlıklı binary frame'lerle taşınır. |
| [0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md) | VT kütüphanesi | Önerildi | Karar, M1 aşamasında üç adayın benchmark sonucunu bekliyor. |
| [0004](https://github.com/nomux-sh/docs/blob/main/adr/0004-gpui-desktop.md) | Desktop istemcisi için GPUI | Kabul edildi | Desktop istemcisi GPUI kullanır. WebView ya da Electron kullanmaz. |
| [0005](https://github.com/nomux-sh/docs/blob/main/adr/0005-extension-model.md) | Extension modeli | Kabul edildi | Daemon parçaları ayrı process'lerdir. UI parçaları WASM bileşenleridir. İzinleri bir manifest bildirir. |
| [0006](https://github.com/nomux-sh/docs/blob/main/adr/0006-licensing.md) | Lisanslama | Kabul edildi | Kod `MIT OR Apache-2.0`, dokümantasyon CC BY 4.0 ile lisanslıdır. Katkılar DCO ile alınır. |
| [0007](https://github.com/nomux-sh/docs/blob/main/adr/0007-status-source-order.md) | Durum kaynaklarının sırası | Kabul edildi | Tek bir çözümleyici durum kaynaklarını sabit bir sırayla birleştirir ve her durumu kaynağıyla birlikte saklar. |

## Durum değerleri

ADR dosyalarında durum İngilizce yazılır. Karşılıkları şöyledir:

| Durum | Anlamı |
|---|---|
| Önerildi (Proposed) | Kayıt tartışmaya açık. Karar henüz verilmedi. |
| Kabul edildi (Accepted) | Karar verildi ve yürürlükte. |
| Reddedildi (Rejected) | Öneri tartışıldı ve kabul edilmedi. |
| Kullanımdan kalktı (Deprecated) | Karar artık yürürlükte değil ve yerine geçen bir kayıt yok. |
| Yerini başkası aldı (Superseded) | Bu kaydın yerini daha yeni bir kayıt aldı. Kayıt, yenisinin adını verir. |
