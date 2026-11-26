---
title: Extension'lar
description: nomux'ta extension nedir, daemon onunla ne yapar, parçalarından hangileri bugün var ve extension SDK'sında neler bulunur.
---

nomux'un tasarımında çekirdekte olmayan her özellik bir extension'dır: git, dosyalar, agent adapter'ları ve diğerleri. Bu tasarımı [kavramlara genel bakış](/docs/tr/concepts/overview/) sayfası anlatır.
Bu sayfa ise bugün var olanı anlatır.

nomux 0.3.0, extension'ların daemon parçasını çalıştırır. `nomux ext` komutları bir extension'ı bir dizinden kurar, listeler, çağırır ve kaldırır. Bu komutları rehberlerdeki [Extension'lar](/docs/tr/guides/extensions/) sayfası gösterir.

## Extension nedir

Extension; bir manifest'i (`extension.toml`) ve bir ya da daha fazla parçası olan bir pakettir.

| Parça | Nerede çalışır | Bugünkü durum |
|---|---|---|
| daemon parçası | Host'ta, ayrı bir process olarak | Protokolü ve bir Rust SDK'sı yayında. `nomuxd` 0.3.0 onu başlatır ve durdurur. |
| arayüz parçası | İstemcide | Yok. Bu iş desktop istemcisiyle birlikte başlayacak. |

**Daemon parçası** bir programdır. Daemon onu ilk çağrıda child process olarak başlatır, 60 saniye çağrı gelmezse durdurur.
İki process, daemon parçasının standart girdisi ve standart çıktısı üzerinden mesajlaşır. Daemon parçası log'unu standart hataya yazar.
Daemon parçası ayrı bir process olduğu için onun çökmesi daemon'un çökmesi demek değildir. Protokoldeki kural şudur: extension'ın process'i sonlanırsa daemon ve Session'lar çalışmaya devam eder.

**Arayüz parçası**, istemcide çalışan bir WASM component olarak planlanıyor. Manifest bugünden bir `[ui]` tablosu kabul eder, ama arayüz parçasını yükleyen bir şey yoktur.

Extension modeli ve gerekçeleri [ADR-0005](https://github.com/nomux-sh/docs/blob/main/adr/0005-extension-model.md)'te yazar (İngilizce).

## SDK'da bugün neler var

SDK, [`extension-api`](https://github.com/nomux-sh/extension-api) reposudur. İlk sürümü 0.1.0'dır. Repodaki dokümanlar İngilizcedir.

| Parça | İçerik |
|---|---|
| [Extension protokolü](https://github.com/nomux-sh/extension-api/blob/main/spec/extension-protocol.md) | Daemon ile daemon parçası arasındaki mesajların spesifikasyonu: handshake, yaşam döngüsü, iki yönlü çağrılar, event'ler, hatalar ve iptal. Durumu taslaktır. |
| [`nomux-extension`](https://crates.io/crates/nomux-extension) 0.1.0 | Daemon parçası yazmak için Rust crate'i. Siz metotları kaydedersiniz, protokolü crate yürütür. Dokümantasyonu [docs.rs](https://docs.rs/nomux-extension)'te. |
| Manifest | `extension.toml` dosyasının [JSON Schema'sı](https://github.com/nomux-sh/extension-api/blob/main/schema/extension.schema.json) ve crate'in içindeki doğrulayıcı (`manifest` feature'ı). |
| [Örnek](https://github.com/nomux-sh/extension-api/tree/main/examples/echo) | Tek metodu ve tek event'i olan bir extension ile onu child process olarak çalıştıran bir test. |

Crate'te async runtime yoktur. Extension'ın metotlarını tek thread'de, sırayla çalıştırır.
Daemon parçasının nasıl yazıldığını [`extension-api` README'si](https://github.com/nomux-sh/extension-api#write-an-extension) gösterir.

## Manifest

Örnek extension'ın manifest'i şöyledir:

```toml
[extension]
id = "nomux.echo"
name = "Echo"
version = "0.1.0"
api = "^0.1"

[daemon]
command = "bin/nomux-echo"
lazy = true
```

- `api`, extension'ın kullanabildiği extension API sürümlerini verir. Extension API'sinin kendi sürümü vardır; bu, `nomux-extension` crate'inin sürümüdür ve nomux'un sürümünden bağımsızdır.
- `daemon.command`, daemon parçasının programıdır. Varsayılan olan `lazy = true` ile daemon parçası ancak bir istemci ihtiyaç duyduğunda başlar.
- `[permissions]` tablosu extension'ın ihtiyaç duyduğu dizinleri, programları, ağ erişimini ve host servislerinin scope'larını sayar. Bu izinleri `nomux ext install` ile siz onaylarsınız. Daemon, onaylanan izinleri handshake'te daemon parçasına iletir.
- Daemon yalnızca host servislerinin scope'larını uygular. Diğer izinlere extension'ın kendisinin uyması gerekir: nomux 0.3.0'da daemon, extension'ın dosyalarını, programlarını ve ağ erişimini kısıtlamaz.

## Henüz olmayanlar

- Extension'ı onaylanan dizinler, programlar ve ağ erişimiyle sınırlamak.
- Daha fazla host servisi. Daemon'da tek bir host servisi var: `sessions:read` scope'lu `sessions.list`.
- Extension event'lerinin istemcilere iletilmesi.
- Arayüz parçası ve API'si.
- Resmi bir extension'ın release'i, bir registry, imza kontrolü ve bir güncelleme komutu. Git extension'ı [`extensions`](https://github.com/nomux-sh/extensions) reposunun `main` branch'inde duruyor.

Extension'lar [yol haritasındaki](/docs/tr/project/roadmap/) M3 aşamasının konusudur. Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.
