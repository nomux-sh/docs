---
title: Extension'lar
description: Bir extension'ı release arşivinden ya da kaynaktan edinin, nomux CLI ile onayladığınız izinlerle kurun, listeleyin, çağırın, devre dışı bırakın ve kaldırın.
---

Extension nomux'a bir özellik ekler. Daemon parçası, Host'taki daemon'un ilk çağrıda başlattığı ve boşta kalınca durdurduğu bir programdır.
Bu sayfa bir extension'ı CLI ile nasıl kullanacağınızı gösterir. Extension yazmak için [Extension yazmak](/docs/tr/guides/write-an-extension/) sayfasını ve [extension SDK](https://github.com/nomux-sh/extension-api#write-an-extension)'yı okuyun. Modeli [Extension'lar](/docs/tr/concepts/extensions/) kavram sayfası anlatır.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'ta verdiği gerçek çıktılardır. Çalıştırmanın home dizini `/home/user` olarak gösterilir.

## Hangi extension'lar var

Resmi extension'lar `git` ve `agent-claude` 0.1.0 sürümüyle yayında. GitHub iki sürümü de pre-release olarak işaretler. Arşivleri [sürümler sayfasında](https://github.com/nomux-sh/extensions/releases). Registry yok.

**`nomux ext install` bir dizinden kurar.** Arşivi ya da URL'yi okumaz. Bir release arşiviyle komut başarısız olur, çünkü yol bir dizin değildir:

```console
$ nomux ext install ./nomux-git-0.1.0-x86_64-unknown-linux-musl.tar.gz --grant-all
nomux: the package was not read or written: Not a directory (os error 20)
```

Bu yüzden arşivi indirin, sağlama toplamını kontrol edin ve açın; sonra dizini kurun. Bu adımları gerçek çıktıyla [Claude Code adapter'ı](/docs/tr/guides/claude-code/#extension-kurulumu) sayfası gösterir. `extensions` reposundaki her release için aynıdır.

Bu sayfa üç extension kullanır:

| Extension | Kimlik | Kaynak | Manifest'teki izinler |
|---|---|---|---|
| Echo | `nomux.echo` | SDK'nın örneği: `v0.1.3` etiketindeki [`extension-api/examples/echo`](https://github.com/nomux-sh/extension-api/tree/v0.1.3/examples/echo), kaynağından derlendi | Yok |
| Git | `nomux.git` | `git@0.1.0` release'inin `nomux-git-0.1.0-<hedef>.tar.gz` release arşivi | `fs=${worktree}`, `process=git` |
| Claude Code adapter'ı | `nomux.agent-claude` | `agent-claude@0.1.0` release'inin `nomux-agent-claude-0.1.0-<hedef>.tar.gz` release arşivi | `scope=hooks:read`, `scope=agent:report` |

Claude Code adapter'ı Claude Code'un durumunu bildirir. Bu sayfa yalnızca manifest'ini kontrol eder. Onu kurmayı ve kullanmayı [Claude Code adapter'ı](/docs/tr/guides/claude-code/) rehberi anlatır.

Bir release arşivinde tek bir dizin vardır: `extension.toml`, `bin/<program>` ve iki lisans dosyası. Onu yeni bir dizine açın. Echo örneğinin arşivi yok. Onu `v0.1.3` etiketinden derleyin ve manifest'i ile programı bir dizine koyun:

```sh
git clone --depth 1 --branch v0.1.3 https://github.com/nomux-sh/extension-api.git
cd extension-api
cargo build --release -p nomux-echo
mkdir -p ../nomux-echo/bin
cp examples/echo/extension.toml ../nomux-echo/
cp target/release/nomux-echo ../nomux-echo/bin/
```

Repo Rust sürümünü sabitler, rustup onu kurar. Go ve TypeScript'teki echo örneği aynı biçimdedir. Onları nasıl derleyeceğinizi [Extension yazmak](/docs/tr/guides/write-an-extension/) sayfası söyler.

nomux 0.5.0 bir extension'a extension API'nin 0.1.1 sürümünü sunar. 0.1.3 sürümündeki SDK'lar API 0.1.1'i uygular: bir SDK paketinin sürümü, extension API'nin sürümü değildir. `api = "^0.1"` ya da `"^0.1.1"` olan bir manifest kurulur. `api = "^0.1.2"` olan bir manifest kurulmaz:

```console
$ nomux ext install ./t
nomux: the extension needs the extension API version ^0.1.2, but the host supplies 0.1.1
```

## Bir paketi kontrol etmek

`nomux ext validate`, bu bilgisayardaki bir dizinin manifest'ini kontrol eder. Daemon gerektirmez:

```console
$ nomux ext validate ./nomux-echo
extension.toml is valid: nomux.echo 0.1.0 (Echo) asks for no permissions
$ nomux ext validate ./nomux-git
extension.toml is valid: nomux.git 0.1.0 (Git) asks for the permissions: fs=${worktree} process=git
$ nomux ext validate ./nomux-agent-claude
extension.toml is valid: nomux.agent-claude 0.1.0 (Claude Code adapter) asks for the permissions: scope=hooks:read scope=agent:report
```

Geçerli olmayan bir manifest, her sorun için alanın yoluyla bir satır ve 1 çıkış kodu verir. `extension.toml` olmayan bir dizin 2 çıkış kodu verir:

```console
$ nomux ext validate ./broken
extension.toml is not valid:
  `extension.id` must have two or more parts with `.` between them, in 64 characters at most. A part starts with a lower-case letter and has only lower-case letters, digits and `-`
$ nomux ext validate ./missing
nomux: the file ./missing/extension.toml does not exist
```

`validate` paketin diğer dosyalarını kontrol etmez. `install` ayrıca paketin daemon parçasının programını içerdiğinden emin olur.

## İzinlerle kurmak

Bir extension yalnızca sizin onayladığınız izinleri alır. Hiçbir komut soru sormaz; bu yüzden onayı komut satırında verirsiniz.
Onay olmadan `install`, extension'ın ne istediğini yazdırır, hiçbir şey kurmaz ve 4 çıkış kodu verir:

```console
$ nomux ext install ./nomux-git
nomux: the extension nomux.git 0.1.0 asks for these permissions:
  fs=${worktree}
  process=git
Nothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>
```

| Komut satırı | Sonuç |
|---|---|
| `--grant <izin>`, bir ya da daha çok kez | Extension bu izinleri alır; istediği diğerlerini almaz |
| `--grant-all` | Extension istediği her izni alır, ama `${worktree}` ile başlayan bir dizini almaz |
| `--grant-all --grant fs=<dizin>` | Aynısı; ayrıca `${worktree}` için dizin |
| Seçenek yok ve manifest hiçbir izin istemiyor | Extension kurulur |

Bir izin şu biçimlerden birindedir: `fs=<dizin>`, `process=<program>`, `network` veya `scope=<kapsam>`. `${worktree}` ile başlayan bir öğe için mutlak bir yol verin.

Yalnızca `--grant-all` ile git extension'ı `process=git` alır, dizin almaz. Aynı extension'ın ikinci kurulumu 1 çıkış koduyla başarısız olur:

```console
$ nomux ext install ./nomux-git --grant-all
extension nomux.git 0.1.0 installed with the permissions: process=git
$ nomux ext install ./nomux-git --grant-all --grant fs=/home/user/demo/project
nomux: the extension `nomux.git` is already installed
```

İzinleri değiştirmek ya da yeni bir sürüm kurmak için extension'ı kaldırın ve yeniden kurun. Manifest'in istemediği bir izin için `--grant`, 1 çıkış koduyla başarısız olur ve hiçbir şey kurulmaz:

```console
$ nomux ext rm nomux.git
extension nomux.git removed
$ nomux ext install ./nomux-git --grant network
nomux: the manifest does not ask for the permission `network`
$ nomux ext install ./nomux-git --grant-all --grant fs=/home/user/demo/project
extension nomux.git 0.1.0 installed with the permissions: fs=/home/user/demo/project process=git
$ nomux ext install ./nomux-echo
extension nomux.echo 0.1.0 installed with no permissions
```

Daemon paketi kopyalar. Bu yüzden kaynak dizindeki sonraki bir değişiklik hiçbir şeyi değiştirmez. Bir pakette yalnızca normal dosyalar ve dizinler olabilir: daemon bir symbolic link'i reddeder.
`install` hiçbir process başlatmaz. İlk çağrı başlatır.

Bir kapsam, bir host servisine ya da daemon'un olaylarına erişim verir. nomux 0.5.0'ın üç kapsamı var:

| Kapsam | Verdiği |
|---|---|
| `sessions:read` | `sessions.list` host servisi: Host'taki Session'lar |
| `agent:report` | `agent.report` ve `agent.child` host servisleri: bir Agent çalışmasının ve Alt işlerinin durumu |
| `hooks:read` | Manifest'in `[adapter]` tablosunda adı geçen araçların hook olayları |

`[adapter]` tablosu bir extension'ı bir agent aracının [adapter'ı](/docs/tr/guides/agent-adapters/) yapar. `nomux.agent-claude` manifest'inde olduğu gibi, `^0.1.1` extension API sürümünü gerektirir.

:::caution
nomux 0.5.0'da daemon yalnızca kapsamları (`sessions:read`, `agent:report` ve `hooks:read`) uygular. Onaylanan diğer izinleri (`fs`, `process` ve `network`) extension'a verir ve onlara extension'ın kendisi uymalıdır. Bir extension'ın process'i daemon'un dosya erişimine sahiptir.
Git extension'ı izinlerini her isteğe uygular: kuralları [README'sinde](https://github.com/nomux-sh/extensions/tree/main/git#permissions) var.
Yalnızca kaynağına güvendiğiniz bir extension'ı kurun.
:::

## Listelemek

```console
$ nomux ext ls
ID          NAME  VERSION  STATE    PERMISSIONS                                                           REASON
nomux.echo  Echo  0.1.0    stopped  -
nomux.git   Git   0.1.0    stopped  fs=/home/user/demo/project,process=git
```

| Durum | Anlamı |
|---|---|
| `stopped` | Extension etkin ve process'i çalışmıyor. Sonraki çağrı onu başlatır |
| `starting` | Process başladı, hazır değil |
| `running` | Process çalışıyor. Çağrı gelmezse 60 saniye sonra durur |
| `failed` | Process başarısız oldu. Bir aradan sonra sonraki çağrı onu yeniden başlatır. `REASON` hatayı içerir |
| `disabled` | Daemon extension'ı başlatmaz. `REASON` nedenini söyler: siz devre dışı bıraktınız ya da art arda 5 kez başarısız oldu |
| `unknown` | Daemon CLI'dan daha yeni ve CLI'ın bilmediği bir durum gönderdi |

Çağrı almayan kurulu bir extension'ın process'i yoktur. Daemon'a bir listede bir kayda mal olur.

## Çağırmak

`nomux ext call`, bir extension'ın tek bir metodunu çağırır ve sonucun payload'unu, başka hiçbir bayt eklemeden standart çıktıya yazar. Komut script'ler ve testler içindir.
Payload'lar baytlardır. Kodlamalarını metot belirler. Bu sayfadaki iki extension'ın metotları protobuf mesajları kullanır.

Bu, git extension'ının `status` metodunun `/home/user/demo/project` dizinindeki Git reposu için çağrısıdır. `status-request.bin` dosyası, `repository` alanı bu dizin olan bir `StatusRequest` mesajı içerir. Mesajların şemaları extension'ın [`proto`](https://github.com/nomux-sh/extensions/tree/git%400.1.0/git/proto/nomux/git/v1) dizinindedir.

```console
$ nomux ext call nomux.git status --payload @status-request.bin > status-response.bin
$ wc -c status-response.bin
23 status-response.bin
$ nomux ext ls
ID          NAME  VERSION  STATE    PERMISSIONS                                                           REASON
nomux.echo  Echo  0.1.0    stopped  -
nomux.git   Git   0.1.0    running  fs=/home/user/demo/project,process=git
```

Çağrı extension'ın process'ini başlattı. Bu çalıştırmadaki repo, `main` branch'inde, git'in izlemediği tek bir dosyası olan yeni bir repodur. Sonuç, 23 baytlık bir `StatusResponse` mesajıdır.

Örneğin `echo` metodu aldığı mesajı geri verir. Payload'u, `hi` metnini içeren bir protobuf mesajıdır:

```console
$ printf '\n\002hi' > request.bin
$ nomux ext call nomux.echo echo --payload @request.bin > response.bin
$ od -c response.bin
0000000  \n 002   h   i
0000004
```

`--payload <metin>` bir metnin baytlarını gönderir, `--payload @<dosya>` bir dosyanın içeriğini gönderir. Seçenek olmazsa payload boştur.

| Sonuç | Çıkış kodu |
|---|---|
| Metot bir sonuç verdi | 0 |
| Bu kimlikte extension yok ya da extension'ın o metodu yok | 2 |
| Extension 30 saniyede cevap vermedi | 3 |
| Extension, iznin olmadığını cevapladı | 4 |
| Extension devre dışı, process'i başlamıyor ya da başarısız oldu veya farklı bir hatayla cevap verdi | 1 |

3 ve 4 çıkış kodları [CLI başvurusundan](/docs/tr/reference/cli/#nomux-ext-call) alınmıştır. Bu sayfa o iki durumu üretmedi. Diğerleri gerçektir:

```console
$ nomux ext call nomux.echo nothing
nomux: the extension answered with an error: the extension has no method `nothing`
$ nomux ext call nomux.echo echo
nomux: the extension answered with an error: the text is empty
$ nomux ext call nomux.nothing echo
nomux: no extension has the identifier nomux.nothing
```

Bir extension'ın hatası kendi process'inde kalır. Daemon, Session'lar ve diğer extension'lar devam eder.

## Olaylar

Bir extension olay gönderebilir. Daemon onu olay günlüğüne koyar ve bir istemci günlüğü `nomux events --follow` ile okur. Örneğin `echo` metodu her çağrıda, metninin uzunluğuyla `echoed` olayını gönderir.

`--filter extension-event` yalnızca extension olaylarını yazdırır. Bu komutu bir terminalde başlatın, ikinci bir terminalde `nomux ext call nomux.echo echo --payload @request.bin` çalıştırın:

```console
$ nomux events --follow --filter extension-event
2 extension nomux.echo: echoed (2 bytes)
```

Bir satır; olayın günlükteki yeri (numara daemon yeniden başlayınca baştan başlar), extension'ın kimliği, olayın adı ve payload'unun boyutundan oluşur. `--json` ile bir olay, tek satırda bir JSON belgesi olur. Payload base64'tür, çünkü kodlamayı extension seçer. Buradaki `CAI=`, uzunluğu 2 olan bir protobuf mesajıdır:

```console
$ nomux --json events --follow --filter extension-event
{"schema_version":1,"event":{"seq":2,"at_ms":1795706993166,"type":"extension_event","extension":{"id":"nomux.echo","name":"echoed","payload_base64":"CAI="}}}
```

Komut kendi başlangıcından sonraki olayları yazdırır ve `Ctrl-C` ile 0 çıkış koduyla biter. Daemon son 1024 olayı bellekte tutar ve payload'u 64 KiB'tan büyük bir olayı atar. [Agent durumu](/docs/tr/guides/agent-status/#olaylar) sayfası aynı komutu durum olayları için kullanır.

## Devre dışı bırakmak, etkinleştirmek ve kaldırmak

```console
$ nomux ext disable nomux.echo
extension nomux.echo disabled
$ nomux ext call nomux.echo echo --payload @request.bin
nomux: the extension nomux.echo: the extension is disabled: the user disabled the extension
$ nomux ext enable nomux.echo
extension nomux.echo enabled
```

`disable` extension'ın process'ini durdurur. `nomux ext ls` sonra `disabled` durumunu ve `the user disabled the extension` nedenini gösterir. `enable`, daemon'un art arda 5 başarısızlıktan sonra devre dışı bıraktığı bir extension'ı da etkinleştirir.

`rm` process'i durdurur ve extension'ın paketini, onaylanan izinlerini ve çalışma dizinini kaldırır:

```console
$ nomux ext rm nomux.echo
extension nomux.echo removed
$ nomux ext rm nomux.echo
nomux: no extension has the identifier nomux.echo
$ nomux ext rm nomux.git
extension nomux.git removed
$ nomux ext ls
no extensions
```

Bu kimlikte extension yoksa `enable`, `disable` ve `rm` 2 çıkış kodu verir.

## Extension'lar nerede

| Bilgisayar | Dizin |
|---|---|
| Linux | `~/.local/share/nomux/extensions` |
| macOS | `~/Library/Application Support/nomux/extensions` |

Dizinin modu 0700'dür. Paketleri, her extension'ın onaylanan izinlerini ve her extension'ın çalışma dizinini içerir: `packages`, `state` ve `data` dizinleri. Kurulu bir extension, Host yeniden başlatıldıktan sonra da kalır. Linux yolu bu çalıştırmada okundu. macOS yolu [extension host dokümantasyonundan](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/extensions.md) gelir.

Extension'lar tek bir Host'a aittir. `--host <ad>` ile `ext` komutları [uzak bir Host](/docs/tr/guides/remote-hosts/)'un daemon'unu kullanır ve `install`'ın dizini o Host'ta mutlak bir yoldur. `ext validate` her zaman kendi bilgisayarınızdaki bir dizini okur. SSH üzerinden bir Host'la yapılan bir deneme çalıştırmasında `nomux --host vps ext install /path/on/the/host/nomux-echo`, `ext ls` ve `ext call` çalıştı; payload dosyası CLI'ın bilgisayarındaydı.

## Bu sürümün sınırları

Bu maddeler nomux 0.5.0'ın [`docs/extensions.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/extensions.md#not-done-yet) dosyasından gelir:

- Daemon, bir extension'ın dosyalarını, programlarını ve ağını kısıtlamaz.
- Daemon'un üç host servisi var: `sessions.list` (`sessions:read` kapsamı) ve adapter'lar için `agent.report` ile `agent.child` (`agent:report` kapsamı).
- Arşivden, URL'den ya da registry'den kurulum yok; imza kontrolü yok; güncelleme komutu yok: extension'ı kaldırın ve yeni sürümü kurun.
- Daemon bir extension'a olayı yalnızca bir adapter'ın `hook` metodunun çağrısı olarak gönderir. Hiçbir istemci bir extension'ın UI parçasını göstermez.
- Daemon bir extension'ın process'ini durdurduğunda, extension'ın başlattığı process'ler çalışmaya devam eder.

[CLI başvurusu](/docs/tr/reference/cli/#nomux-ext-install) her `ext` komutunu JSON belgesiyle birlikte içerir. Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/)'ten gelir.
