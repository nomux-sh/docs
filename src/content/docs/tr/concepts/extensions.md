---
title: Extension'lar
description: nomux'ta extension nedir, parçalarından hangileri bugün var ve extension SDK'sında neler bulunur.
---

nomux'un tasarımında çekirdekte olmayan her özellik bir extension'dır: git, dosyalar, agent adapter'ları ve diğerleri. Bu tasarımı [kavramlara genel bakış](/docs/tr/concepts/overview/) sayfası anlatır.
Bu sayfa ise bugün var olanı anlatır.

:::caution
nomux 0.1.0 extension çalıştırmaz. Daemon'da henüz bir extension host'u yok; extension kuran bir komut da yok.
Bugün SDK ile bir extension'ın daemon parçasını yazıp test edebilirsiniz. Onu nomux'un içinde kullanamazsınız.
:::

## Extension nedir

Extension; bir manifest'i (`extension.toml`) ve bir ya da daha fazla parçası olan bir pakettir.

| Parça | Nerede çalışır | Bugünkü durum |
|---|---|---|
| daemon parçası | Host'ta, ayrı bir process olarak | Protokolü ve bir Rust SDK'sı yayında. Daemon henüz daemon parçası başlatmıyor. |
| arayüz parçası | İstemcide | Yok. Bu iş desktop istemcisiyle birlikte başlayacak. |

**Daemon parçası** bir programdır. Tasarıma göre daemon onu, bir istemci ihtiyaç duyduğunda child process olarak başlatır ve boşta kalınca durdurur.
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
- `[permissions]` tablosu extension'ın ihtiyaç duyduğu dizinleri, programları, ağ erişimini ve host servislerinin scope'larını sayar. Protokol, onaylanan izinleri handshake'te daemon parçasına iletir. Bu izinleri uygulayan bir nomux sürümü henüz yoktur.

## Henüz olmayanlar

- Daemon'daki extension host'u. `nomuxd` 0.1.0 hiçbir extension başlatmaz.
- Extension'ın çağırabileceği host servisleri ve scope adlarının listesi. Protokol, bir extension'ın host servisini nasıl çağıracağını tanımlar; scope olarak yalnızca `sessions:read` adı geçer.
- Arayüz parçası ve API'si.
- Resmi extension'lar, bir registry ve extension kuran bir komut.

Extension'lar [yol haritasındaki](/docs/tr/project/roadmap/) M3 aşamasının konusudur. Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.
