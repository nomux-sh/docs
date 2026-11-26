---
title: Extension'lar
description: nomux'ta extension nedir, daemon onunla ne yapar, parçalarından hangileri bugün var, extension SDK'larında neler bulunur, adapter extension'ı nasıl çalışır ve hangi resmi extension'lar var.
---

nomux'un tasarımında çekirdekte olmayan her özellik bir extension'dır: git, dosyalar, agent adapter'ları ve diğerleri. Bu tasarımı [kavramlara genel bakış](/docs/tr/concepts/overview/) sayfası anlatır.
Bu sayfa ise bugün var olanı anlatır.

nomux 0.4.0, extension'ların daemon parçasını çalıştırır. `nomux ext` komutları bir extension'ı bir dizinden kurar, listeler, çağırır ve kaldırır. Bu komutları rehberlerdeki [Extension'lar](/docs/tr/guides/extensions/) sayfası gösterir. Bir extension yazmak için [Extension yazmak](/docs/tr/guides/write-an-extension/) rehberine bakın.

## Extension nedir

Extension; bir manifest'i (`extension.toml`) ve bir ya da daha fazla parçası olan bir pakettir.

| Parça | Nerede çalışır | Bugünkü durum |
|---|---|---|
| daemon parçası | Host'ta, ayrı bir process olarak | Protokolü ve Rust, TypeScript ve Go SDK'ları yayında. `nomuxd` 0.4.0 onu başlatır ve durdurur. |
| arayüz parçası | İstemcide | Yok. Bu iş desktop istemcisiyle birlikte başlayacak. |

**Daemon parçası** bir programdır. Daemon onu ilk çağrıda child process olarak başlatır, 60 saniye çağrı gelmezse durdurur.
İki process, daemon parçasının standart girdisi ve standart çıktısı üzerinden mesajlaşır. Daemon parçası log'unu standart hataya yazar.
Daemon parçası ayrı bir process olduğu için onun çökmesi daemon'un çökmesi demek değildir. Protokoldeki kural şudur: extension'ın process'i sonlanırsa daemon ve Session'lar çalışmaya devam eder.
Daemon parçası event de gönderebilir. Daemon bunları kendi olay günlüğüne yazar; `nomux events --follow --filter extension-event` onları yazdırır.

**Arayüz parçası**, istemcide çalışan bir WASM component olarak planlanıyor. Manifest bugünden bir `[ui]` tablosu kabul eder, ama arayüz parçasını yükleyen bir şey yoktur.

Extension modeli ve gerekçeleri [ADR-0005](https://github.com/nomux-sh/docs/blob/main/adr/0005-extension-model.md)'te yazar (İngilizce).

## SDK'larda bugün neler var

SDK'lar [`extension-api`](https://github.com/nomux-sh/extension-api) reposundadır. SDK'lar extension API 0.1.1'i uygular. Bir SDK paketinin sürümü, extension API'sinin sürümünden ayrıdır: üç SDK'nın sürümü 0.1.3'tür. Repodaki dokümanlar İngilizcedir.

| Parça | İçerik |
|---|---|
| [Extension protokolü](https://github.com/nomux-sh/extension-api/blob/main/spec/extension-protocol.md) | Daemon ile daemon parçası arasındaki mesajların spesifikasyonu: handshake, yaşam döngüsü, iki yönlü çağrılar, event'ler, hatalar ve iptal. Durumu taslaktır. |
| Rust SDK: [`nomux-extension`](https://crates.io/crates/nomux-extension) crate'i 0.1.3 | Siz metotları kaydedersiniz, protokolü crate yürütür. Dokümantasyonu [docs.rs](https://docs.rs/nomux-extension)'te. |
| TypeScript SDK: [`@nomux-sh/extension`](https://github.com/nomux-sh/extension-api/tree/main/sdk/typescript) paketi 0.1.3 | Node.js 22 ya da üstü gerekir. Paket [npm](https://www.npmjs.com/package/@nomux-sh/extension)'de yayında. |
| Go SDK: [`github.com/nomux-sh/extension-api/sdk/go`](https://github.com/nomux-sh/extension-api/tree/main/sdk/go) modülü v0.1.3 | Go 1.26 ya da üstü gerekir. |
| [Conformance suite](https://github.com/nomux-sh/extension-api/tree/main/conformance) | Tek bir test host'u, aynı protokol senaryolarını her SDK'nın `echo` extension'ına karşı çalıştırır. `echo` extension'ı suite'i geçen SDK doğrudur. |
| Manifest | `extension.toml` dosyasının [JSON Schema'sı](https://github.com/nomux-sh/extension-api/blob/main/schema/extension.schema.json) ve Rust crate'inin içindeki doğrulayıcı (`manifest` feature'ı). |
| Örnekler | `echo` extension'ı [Rust](https://github.com/nomux-sh/extension-api/tree/main/examples/echo), [TypeScript](https://github.com/nomux-sh/extension-api/tree/main/examples/echo-typescript) ve [Go](https://github.com/nomux-sh/extension-api/tree/main/examples/echo-go) ile: her birinde tek metot ve tek event. |

Python SDK'sı planlanıyor.

Daemon parçası bir process olduğu için onu byte okuyup yazabilen her dilde yazabilirsiniz. SDK; çerçeveleme, handshake, metotlar, host servislerinin çağrıları, event'ler, iptal ve kapanışı sağlar.
Rust crate'inde async runtime yoktur. Extension'ın metotlarını tek thread'de, sırayla çalıştırır.
Daemon parçasının nasıl yazıldığını `extension-api` README'si [Rust](https://github.com/nomux-sh/extension-api#write-an-extension), [TypeScript](https://github.com/nomux-sh/extension-api#write-an-extension-in-typescript) ve [Go](https://github.com/nomux-sh/extension-api#write-an-extension-in-go) için gösterir.

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

- `api`, extension'ın kullanabildiği extension API sürümlerini verir. Extension API'sinin kendi sürümü vardır; bu, SDK'ların sürümüdür ve nomux'un sürümünden bağımsızdır.
- nomux 0.4.0, `nomux-extension` 0.1.1 ile derlenir; yani extension API'si en yeni SDK'ların 0.1.2'si değil, 0.1.1'dir. nomux 0.4.0, daha yeni bir sürüm isteyen manifest'i, örneğin `api = "^0.1.2"`, reddeder. `^0.1` yazın; manifest'te bir `[adapter]` tablosu varsa `^0.1.1` yazın.
- `daemon.command`, daemon parçasının programıdır. Varsayılan olan `lazy = true` ile daemon parçası ancak bir istemci ihtiyaç duyduğunda başlar.
- `[permissions]` tablosu extension'ın ihtiyaç duyduğu dizinleri, programları, ağ erişimini ve host servislerinin scope'larını sayar. Bu izinleri `nomux ext install` ile siz onaylarsınız. Daemon, onaylanan izinleri handshake'te daemon parçasına iletir.
- Daemon yalnızca host servislerinin scope'larını uygular. Diğer izinlere extension'ın kendisinin uyması gerekir: nomux 0.4.0'da daemon, extension'ın dosyalarını, programlarını ve ağ erişimini kısıtlamaz.

## Host servisleri

Extension, daemon'un bir host servisini çağırır. Daemon yalnızca servisin scope'unu onayladıysanız cevap verir.

| Metot | Scope | Ne yapar |
|---|---|---|
| `sessions.list` | `sessions:read` | Host'taki Session'ları durumları ve tanımlarıyla verir |
| `agent.report` | `agent:report` | Bir Session'ın Agent çalışmasının durumunu bildirir |
| `agent.child` | `agent:report` | Bir Alt işi başlatır, değiştirir ya da bitirir |

## Adapter extension'ları

Adapter, bir agent aracının [agent durumunu](/docs/tr/guides/agent-status/) o aracın hook olaylarından bildiren extension'dır. Araç, olaylarında `nomux hook <araç> <olay>` komutunu çalıştırır; daemon Session'ın token'ını kontrol edip olayı adapter'a verir; adapter da `agent.report` ve `agent.child` servislerini çağırır.

Adapter'ın manifest'i araçlarını bir `[adapter]` tablosunda sayar ve iki scope ister. Claude Code adapter'ının manifest'i şöyledir:

```toml
[extension]
id = "nomux.agent-claude"
name = "Claude Code adapter"
version = "0.1.0"
api = "^0.1.1"

[daemon]
command = "bin/nomux-agent-claude"
lazy = true

[adapter]
tools = ["claude"]

[permissions]
scopes = ["hooks:read", "agent:report"]
network = false
```

| Scope | Ne verir |
|---|---|
| `hooks:read` | `[adapter]` tablosundaki araçların hook olayları. Bu scope olmadan daemon extension'a hiç olay vermez |
| `agent:report` | `agent.report` ve `agent.child` host servisleri. Bu scope'lu bir adapter, Host'taki her Session için durum bildirebilir |

- Adapter'ın iki metodu vardır. Daemon her olay için `hook` metodunu çağırır. `hooks.plan`, aracın ayar dosyasında hook'ların gerektirdiği girdileri tanımlar. Bunları nomux `nomux hooks install <araç> --apply` ile yazar; adapter hiçbir dosya yazmaz.
- Bir aracın adını birden fazla extension sayarsa, kimliği en küçük olan extension adapter olur.
- Bu sürümde `hook` çağrısının cevabı boştur: nomux henüz bir izin istemine karar vermez.

[Agent adapter'ları ve hook'lar](/docs/tr/guides/agent-adapters/) rehberi adapter yazmayı anlatır. [Claude Code adapter'ı](/docs/tr/guides/claude-code/) rehberi Claude Code adapter'ını iş başında gösterir.

## Resmi extension'lar

Resmi extension'lar [`extensions`](https://github.com/nomux-sh/extensions) reposundadır. Üçüncü taraf bir extension'ın kullandığı aynı herkese açık extension API'sini kullanırlar. İkisinin de release'i yok: kaynaktan derler, bir dizinden kurarsınız.

| Extension | Kimlik | Bugün ne yapar |
|---|---|---|
| Git | `nomux.git` | Daemon parçasında status, diff, staging, commit, branch'ler, log, blame, worktree'ler ve dosya event'lerinden gelen bir status var. |
| Claude Code adapter | `nomux.agent-claude` | Daemon parçası, bir Claude Code Session'ının ve subagent'larının durumunu Claude Code hook'larından bildirir ve hook'ların kurulumunu tanımlar. |

İki extension'ın da arayüz parçası yok.

## Henüz olmayanlar

- Extension'ı onaylanan dizinler, programlar ve ağ erişimiyle sınırlamak.
- Daha fazla host servisi.
- Daemon'dan extension'a event'ler. Adapter, hook olaylarını `hook` metodunun çağrıları olarak alır.
- Başka agent araçları için adapter'lar ve kullanıcının kararını taşıyan bir `hook` cevabı.
- Arayüz parçası ve API'si.
- Resmi bir extension'ın release'i, bir registry, imza kontrolü ve bir güncelleme komutu.

Extension'lar [yol haritasındaki](/docs/tr/project/roadmap/) M3 aşamasının konusudur. Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.
