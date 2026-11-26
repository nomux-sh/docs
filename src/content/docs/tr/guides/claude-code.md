---
title: Claude Code adapter'ı
description: nomux.agent-claude extension'ını release arşivinden kurun, Claude Code'un hook'larını kurun; extension'ın hangi izinleri istediğini, nomux'un bir Claude Code Session'ı için ne gösterdiğini ve neyin henüz olmadığını öğrenin.
---

`nomux.agent-claude` extension'ı, `claude` aracının ([Claude Code](https://code.claude.com)) [adapter'ıdır](/docs/tr/guides/agent-adapters/).
Claude Code'un hook olaylarını okur; Agent çalışmasının ve Alt işlerinin [durumunu](/docs/tr/guides/agent-status/) daemon'a bildirir. Ayrıca çalışmanın [devam komutunu](/docs/tr/guides/hibernation/) da bildirir.

**Bu extension'ın 0.1.0 sürümü yayında.** Sürüm, `extensions` reposunun [sürümler sayfasındadır](https://github.com/nomux-sh/extensions/releases/tag/agent-claude@0.1.0); GitHub onu pre-release olarak işaretler. Extension'ın README'si, nomux 0.4.0 ya da sonrasını gerektirdiğini söyler. Ayrıca onun Linux'ta Claude Code 2.1.332 ile, beş kısa çalıştırmada test edildiğini söyler. Repoda bu çalıştırmaların hook verisi var. Bu çalıştırmaların göstermediği olayların verisi, Claude Code dokümantasyonundan geliyor.

## Bu sayfa için ne çalıştırıldı

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'ta verdiği gerçek çıktılardır. Çalıştırmanın home dizini `/home/user` olarak gösterilir.

- **Çalıştı:** extension'ın Linux x86-64 release arşivi (indirme, sağlama toplamı, `nomux ext validate`, `nomux ext install`), `nomux hooks install`, gerçek `nomux hook claude <olay>` komutu, gerçek daemon ve gerçek adapter.
- **Çalışmadı:** Claude Code. Durum örnekleri hook verisini yeniden oynatır. `captured` verisi (bir izin isteği, bir araç çağrısı, arka plandaki bir subagent ve eksik bir giriş), Claude Code 2.1.332'nin gerçek verisidir. Diğer veriler, extension reposunun Claude Code dokümantasyonundan yazdığı örneklerdir; metin hangi örneklerin onları kullandığını söyler. Komutları bir script, bir Session'ın shell'ine yazdı. Onları Claude Code göndermedi.
- **Denenmedi:** Linux ARM64 ve macOS arşivleri.

## Extension kurulumu

Bir release arşivinde tek bir dizin vardır. Bu dizin, extension'ın paketidir. `nomux ext install` bir paketi dizinden okur: arşivi ya da URL'yi okumaz. Bu yüzden önce arşivi indirir, sağlama toplamını kontrol eder ve açarsınız.

Release'te her hedef için bir arşiv ve `SHA256SUMS` dosyası vardır:

| Hedef | Bilgisayar |
|---|---|
| `x86_64-unknown-linux-musl` | x86-64 Linux |
| `aarch64-unknown-linux-musl` | ARM64 Linux |
| `x86_64-apple-darwin` | Intel macOS |
| `aarch64-apple-darwin` | Apple silicon macOS |

x86-64 Linux için yeni, boş bir dizinde çalışın:

```sh
tag='agent-claude@0.1.0'
archive=nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl
base="https://github.com/nomux-sh/extensions/releases/download/$tag"
mkdir claude-download && cd claude-download
curl -fsSLO "$base/$archive.tar.gz" -O "$base/SHA256SUMS"
grep " $archive.tar.gz\$" SHA256SUMS | sha256sum --check   # on macOS: shasum -a 256 --check
```

```console
$ grep " $archive.tar.gz$" SHA256SUMS | sha256sum --check
nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl.tar.gz: OK
```

Arşivi kendi yeni dizinine açın, sonra manifest'i kontrol edin:

```console
$ mkdir ../claude-adapter && tar -xzf $archive.tar.gz -C ../claude-adapter
$ cd ../claude-adapter
$ ls -R
.:
nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl

./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl:
bin
extension.toml
LICENSE-APACHE
LICENSE-MIT

./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl/bin:
nomux-agent-claude
$ nomux ext validate ./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl
extension.toml is valid: nomux.agent-claude 0.1.0 (Claude Code adapter) asks for the permissions: scope=hooks:read scope=agent:report
```

### İzinler

Onay vermezseniz `nomux ext install` extension'ın istediği izinleri yazdırır ve hiçbir şey kurmaz:

```console
$ nomux ext install ./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl
nomux: the extension nomux.agent-claude 0.1.0 asks for these permissions:
  scope=hooks:read
  scope=agent:report
Nothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>
```

Çıkış kodu 4'tür. Extension'ın istediği yalnızca bu iki kapsamdır:

| İzin | Neden |
|---|---|
| `scope=hooks:read` | Daemon, `claude` aracının hook olaylarını extension'a verir. |
| `scope=agent:report` | Extension, Agent çalışmasını ve Alt işleri daemon'a bildirir. |

Extension dosya, program ya da ağ erişimi istemez. Hiçbir transcript'i ve Claude Code'un hiçbir dosyasını okumaz.
Daemon yalnızca host servislerinin kapsamlarını uygular. Diğer sınırlara extension'ın kendisi uymalıdır: bkz. [Extension'lar](/docs/tr/guides/extensions/). `agent:report` ile bir adapter, Host'taki her Session için bildirim yapabilir.

İzinleri komut satırında onaylarsınız. `--grant-all` ikisini de onaylar. `--grant <izin>` bir izni onaylar ve extension diğerlerini almaz. Adapter ikisine de ihtiyaç duyar: yalnızca `--grant scope=hooks:read` ile komut extension'ı kurar, ama extension durum bildiremez.

```console
$ nomux ext install ./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl --grant-all
extension nomux.agent-claude 0.1.0 installed with the permissions: scope=hooks:read scope=agent:report
$ nomux ext ls
ID                  NAME                 VERSION  STATE    PERMISSIONS                          REASON
nomux.agent-claude  Claude Code adapter  0.1.0    stopped  scope=hooks:read,scope=agent:report
```

Extension `stopped` durumunda. Daemon onu ilk hook olayında başlatır ve 60 saniye olay gelmezse durdurur. Yeni bir sürümü kurmak için önce extension'ı `nomux ext rm nomux.agent-claude` ile kaldırın.

## Hook'ları kurmak

Claude Code'un hook'larını önce diff görerek kurun. Çıktıyı ve kurulumun ayar dosyanızın biçimini nasıl koruduğunu [Agent adapter'ları ve hook'lar](/docs/tr/guides/agent-adapters/#hookları-kurmak) sayfası anlatır.

```sh
nomux hooks install claude            # show the diff
nomux hooks install claude --apply    # write ~/.claude/settings.json
nomux hooks status                    # installed, missing or different
nomux hooks uninstall claude --apply  # remove the hooks
```

- Her olay için bir girdi, `nomux` komutunu `hook claude <olay>` argümanlarıyla, shell olmadan çalıştırır. `nomux`, Claude Code'un `PATH`'inde olmalıdır.
- Ayar yolu Linux'ta ve macOS'ta aynıdır. Başka bir yapılandırma dizini kullanan (`CLAUDE_CONFIG_DIR`) bir Claude Code bu dosyayı okumaz: hook'ları orada elle kurun ya da dosyayı `claude --settings` ile verin.
- Ayar dosyası, Claude Code 2.1'in gerektirdiği gibi katı JSON olmalıdır. Bir yorum ya da son değerden sonra bir virgül kurulumu durdurur ve nomux hiçbir şeyi değiştirmez.
- Claude Code'u bir nomux Session'ında başlatın. Hook komutu `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini Session'ın ortamından okur. Session'ın dışında `nomux hook` hiçbir şey yapmaz.

## nomux ne gösterir

Adapter her hook olayını bir duruma çevirir. Bu tablo ana kuralları verir. Bu sayfadaki yeniden oynatmalar şu olayları kullandı: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `PostToolBatch`, `SubagentStart`, `SubagentStop`, `Stop`, `SessionEnd`, `Elicitation`, `StopFailure` ve `idle_prompt` ile `elicitation_url_dialog` bildirimleri. Diğer satırlar extension'ın README'sinden ve testlerinden gelir. Eksiksiz tablo [extension'ın README'sinde](https://github.com/nomux-sh/extensions/blob/agent-claude%400.1.0/agent-claude/README.md#rules).

| Hook olayı | Durum |
|---|---|
| `SessionStart` | `idle`; çalışmanın ayrıntılarıyla (Claude Code'un session'ı, model, devam komutu) |
| `UserPromptSubmit` | `working` |
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure` | Araçla birlikte `working`. Adapter bu durumu yalnızca araç olayından çıkarır; bu yüzden bir beklemeyi asla bitirmez. |
| `PermissionRequest` | `needs you: permission`; araç ve çağrının kısa bir ayrıntısıyla |
| Türü `permission_prompt` olan `Notification` | `needs you: permission` |
| Türü `elicitation_dialog`, `idle_prompt` ya da `agent_needs_input` olan `Notification` | `needs you: question` |
| Türü `elicitation_url_dialog` olan `Notification` | `needs you: auth` |
| `Elicitation` | `needs you: question`; `mode` değeri `url` ise `needs you: auth`. Mesaj, MCP sunucusunun adıdır. |
| `SubagentStart`, `SubagentStop` | Bir Alt iş başlar ve `done` olarak biter |
| `Stop` | `done`; bir subagent hâlâ çalışırken `N task runs in the background` mesajıyla `done` |
| `StopFailure` | Hata türü ve ayrıntılarıyla `error` |
| `SessionEnd` | Her Alt iş biter ve çalışma `done` olur (ya da `error`'ını korur) |

İlk örnekte bir izin isteğinin `captured` verisi var. Bir script şu komutları `fix-tests` Session'ının shell'ine yazdı:

```console
$ nomux hook claude SessionStart < 01-SessionStart.json
$ nomux hook claude UserPromptSubmit < 02-UserPromptSubmit.json
$ nomux status
  SESSION    COMMAND    STATE    FOR  MESSAGE
* fix-tests  /bin/bash  working  0s
$ nomux hook claude PreToolUse < 03-PreToolUse.json
$ nomux hook claude PermissionRequest < 04-PermissionRequest.json
$ nomux status
  SESSION    COMMAND    STATE                  FOR  MESSAGE
! fix-tests  /bin/bash  needs you: permission  0s   touch b.txt
$ nomux agent explain fix-tests
session 4v3bafnc: needs you: permission for 0s, from adapter; message from adapter: touch b.txt

sources, in the sequence in which they decide:
  adapter             needs you: permission: touch b.txt (an adapter extension reported it from the events of the agent tool)
  program status      nothing: no program of the session reported a status
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal

from the adapter:
  tool session: 00000000-0000-4000-8000-000000000006
  resume: claude --resume 00000000-0000-4000-8000-000000000006
```

O çalışmadaki Claude Code, `touch b.txt` komutunu çalıştırmak için izin istedi. Cevaptan sonra `PostToolBatch` ve `Stop` olayları durumu önce `working`, sonra `done` yaptı.

İkinci örnekte arka planda bir subagent olan bir çalışmanın `captured` verisi var. Turn'ün `Stop` olayından sonra Session `done` durumunda ve subagent'ı hâlâ çalışıyor. Mesaj bunu söyler:

```console
$ nomux status --tree
  NAME                 COMMAND    STATE    FOR  MESSAGE
+ fix-tests            /bin/bash  done     6s
+ refactor             /bin/bash  done     0s   1 task runs in the background
*   a45f24c823c444cb5             working  2s   read a.txt
```

`SubagentStop` olayı gelince Alt iş `done` olur ve Session'ın mesajı kalmaz:

```console
$ nomux status --tree | grep -E 'NAME|refactor|a45f'
  NAME                 COMMAND    STATE  FOR  MESSAGE
+ refactor             /bin/bash  done   3s
+   a45f24c823c444cb5             done   0s   read a.txt
```

Diğer örnekler, extension reposunun Claude Code dokümantasyonundan yazdığı verileri kullanır. `mcp-setup` Session'ı bir MCP sunucusunun `Elicitation` olaylarını, sonra bir hız limiti yüzünden bir isteğin hatasını aldı:

```console
$ nomux status
  SESSION    COMMAND    STATE                FOR  MESSAGE
! mcp-setup  /bin/bash  needs you: question  0s   my-mcp-server
$ nomux status
  SESSION    COMMAND    STATE            FOR  MESSAGE
! mcp-setup  /bin/bash  needs you: auth  0s   my-mcp-server
$ nomux status
  SESSION    COMMAND    STATE  FOR  MESSAGE
x mcp-setup  /bin/bash  error  0s   rate_limit: 429 Too Many Requests
```

İzin isteğinde araç ve çağrının kısa bir ayrıntısı bulunur (komut, dosya yolu ya da URL), en fazla 160 bayt. Anahtar, token ya da parola gibi görünen bir sözcük `[hidden]` olarak gösterilir. Başka biçimdeki bir secret yine de bir komutun ayrıntısında görünebilir.

### Ayrıntılar ve devam komutu

Adapter çalışmanın ayrıntılarını bildirir: Claude Code'un session kimliği, Claude Code gönderdiyse model ve bir devam komutu. Hook verisinde Claude Code'un komut satırı olmadığı için adapter devam komutunu bildiği alanlardan yapar:

- `claude --resume <session>`.
- Hook verisinde varsa ve değer düz bir ad ise `--model <model>` ve `--agent <agent>`.
- `--permission-mode <mod>` yalnızca `plan`, `acceptEdits` ve `dontAsk` için. İzin kontrollerini atlayan ya da gevşeten bir modu (`bypassPermissions`, `auto`), bir prompt'u ya da bir ortam değişkenini asla içermez.

Model ve agent türü olan bir `SessionStart` verisiyle ayrıntılar şöyle görünür:

```console
$ nomux agent explain za6bvxp6 | tail -5

from the adapter:
  model: claude-haiku-4-5
  tool session: 00000000-0000-4000-8000-000000000100
  resume: claude --resume 00000000-0000-4000-8000-000000000100 --model claude-haiku-4-5 --agent code-reviewer
```

Ayrıntılar, Session bitince ya da hazırda bekleyince kalır. Hazırda bekleyen bir Session'ın [uyandırılması](/docs/tr/guides/hibernation/) devam komutunu değiştirmeden başlatır. Bu çalıştırmada `claude` adlı küçük bir script, Claude Code'un yerine geçti. Aldığı argümanları yazdırır. Claude Code değildir. `Stop` olayından sonra `fix-tests` Session'ı için sonuç şudur:

```console
$ nomux hibernate fix-tests
session 4v3bafnc hibernated: 736.0 KiB given back (pss)
$ nomux wake fix-tests
session fix-tests (4v3bafnc) woke: claude --resume 00000000-0000-4000-8000-000000000006
$ nomux capture fix-tests --lines 1
stand-in claude started with: --resume 00000000-0000-4000-8000-000000000006
```

`fix-tests` Session'ı hazırda bekletmeden önce bir shell çalıştırıyordu. Uyandırmadan sonra komutu, devam komutudur: `nomux ls` `claude --resume 00000000-0000-4000-8000-000000000006` gösterir.

## Adapter'ın asla yapmadıkları

- Bir izin isteğini, bir elicitation'ı ya da bir soruyu sizin yerinize asla cevaplamaz. Her hook'un cevabı boştur.
- Claude Code'un izin modunu asla değiştirmez.
- Bir transcript'i, bir prompt'u, bir dosyanın içeriğini ya da bir aracın tam girdisini asla okumaz, saklamaz veya göndermez.
- Diskte hiçbir şey tutmaz. İhtiyacı olanı bellekte tutar; daemon onu 60 saniye olay gelmeden durdurunca da unutur.

## Bu sürümün sınırları

- **0.1.0 sürümünde `idle_prompt` bir sorudur.** Claude Code, bir turn bittikten yaklaşık 60 saniye sonra, siz bir şey yazmadıysanız `idle_prompt` bildirimini gönderir. Yayımlanmış adapter bunu `needs you: prompt` olarak değil, `needs you: question` olarak bildirir. Prompt'ta duran bir Session bu yüzden kendiliğinden hazırda beklemez ve `nomux hibernate` onu reddeder:

  ```console
  $ nomux hibernate docs-site
  nomux: session it3abqm5 cannot hibernate: its agent waits for an answer of the user
  ```

  `extensions` reposunun `main` dalında, bu bildirim için `prompt` bildiren bir değişiklik var ([`b79f370` commit'i](https://github.com/nomux-sh/extensions/commit/b79f370)). Hiçbir release'te yok. O dalın bir derlemesi, bu sayfa için yapılan bir deneme çalıştırmasında aynı hook verisi için `needs you: prompt` gösterdi ve `nomux hibernate` Session'ı hazırda bekletti. Bir release bu değişikliği içerene kadar, bu sayfanın anlattığı yayımlanmış davranışı kullanın. `nomux` dokümantasyonundaki [adapter'lar](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/adapters.md#not-done-yet) belgesi de bu eksiği listeler.
- Claude Code'un `SessionStart` olayında model her zaman olmaz. O zaman model değişene kadar ayrıntılarda model yoktur. Bu sayfadaki `captured` çalışmanın verisinde model yoktu: `nomux --json status` `"model": null` gösterir.
- Alt iş tek seviyedir: bir subagent'ın subagent'ı, Agent çalışmasının Alt işi olur.
- Bir Session'ın komutu `claude` ise ve komut biterse Session de biter. nomux onun son Agent çalışmasını ve devam komutunu saklar ([Biten Session'lar](/docs/tr/guides/agent-status/#biten-sessionlar)). Bir turn'ün hook verisinden ve `nomux kill`'den sonra `nomux agent explain` şu satırlarla biter:

  ```console
  $ nomux agent explain za6bvxp6 | tail -5

  from the adapter:
    model: claude-haiku-4-5
    tool session: 00000000-0000-4000-8000-000000000100
    resume: claude --resume 00000000-0000-4000-8000-000000000100 --model claude-haiku-4-5 --agent code-reviewer
  ```

  Extension release'inin README'si, nomux'un bu durumda hiçbir şey göstermediğini hâlâ söylüyor. O metin, nomux'un eski bir sürümünü anlatır.
- Aynı hook verisinin bir yeniden oynatmasında, bir `StopFailure` olayının `error` durumunda mesaj yoktu ve mesaj sonradan da görünmedi. Aynı olayların on bir başka yeniden oynatması `rate_limit: 429 Too Many Requests` verdi. İlk durum yeniden oluşmadı.
- UI parçası yok. Desktop istemcisi henüz yok.
- Henüz yok: bir subagent'ın transcript'inden mevcut aracı ve son satırı, onay kartları için bir cevap (daemon bir hook'un cevabını Claude Code'a göndermez), `TeammateIdle` olayının ötesinde agent takımları, kullanım ve maliyet.
