---
title: Claude Code adapter'ı
description: nomux.agent-claude extension'ını ve Claude Code'un hook'larını kurun; extension'ın hangi izinleri istediğini, nomux'un bir Claude Code Session'ı için ne gösterdiğini ve neyin henüz olmadığını öğrenin.
---

`nomux.agent-claude` extension'ı, `claude` aracının ([Claude Code](https://code.claude.com)) [adapter'ıdır](/docs/tr/guides/agent-adapters/).
Claude Code'un hook olaylarını okur; Agent çalışmasının ve Alt işlerinin [durumunu](/docs/tr/guides/agent-status/) daemon'a bildirir.

**Bu extension'ın henüz release'i yok.** `extensions` reposunda indirilecek bir paket yok. Onu kaynağından derler ve bir dizinden kurarsınız.
Extension'ın README'si, onun Linux'ta Claude Code 2.1.332 ile, beş kısa çalıştırmada test edildiğini söyler. Repoda bu çalıştırmaların hook verisi var. Bu çalıştırmaların göstermediği olayların verisi, Claude Code dokümantasyonundan geliyor.

Bu sayfadaki çıktılar, nomux 0.4.0'ın Linux'ta verdiği gerçek çıktılardır. Çalıştırmanın home dizini, geçici `/tmp/nomux-demo` dizinidir.
**Bu sayfa için Claude Code çalıştırılmadı.** Durum örnekleri, `extensions` reposundaki hook verisini yeniden oynatır. Bu veri, gerçek Claude Code çalıştırmalarının gerçek verisidir; nomux 0.4.0'ın gerçek `nomux hook` komutu onu gerçek bir daemon'a ve gerçek adapter'a gönderdi. Veriyi script'ler yeniden oynattı, Claude Code değil.

## Extension'ı derlemek ve kurmak

`git` ve [rustup](https://rustup.rs) gerekir. Repo Rust sürümünü sabitler, rustup onu kurar.

```sh
git clone https://github.com/nomux-sh/extensions.git
cd extensions
cargo build --release -p nomux-agent-claude --locked
```

Bir extension paketi, `extension.toml` dosyasını ve manifest'in adını verdiği programı içeren bir dizindir. Paketi hazırlayın ve nomux'tan onu kurmasını isteyin:

```sh
mkdir -p ~/claude-adapter/bin
cp agent-claude/extension.toml ~/claude-adapter/
cp target/release/nomux-agent-claude ~/claude-adapter/bin/
```

### İzinler

Onay vermezseniz `nomux ext install` extension'ın istediği izinleri yazdırır ve hiçbir şey kurmaz:

```console
$ nomux ext install ./claude-adapter
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

İki kapsamı onaylayın:

```console
$ nomux ext install ./claude-adapter --grant-all
extension nomux.agent-claude 0.1.0 installed with the permissions: scope=hooks:read scope=agent:report
$ nomux ext ls
ID                  NAME                 VERSION  STATE    PERMISSIONS                          REASON
nomux.agent-claude  Claude Code adapter  0.1.0    stopped  scope=hooks:read,scope=agent:report
```

Extension `stopped` durumunda. Daemon onu ilk hook olayında başlatır ve 60 saniye olay gelmezse durdurur.

## Hook'ları kurmak

Claude Code'un hook'larını önce diff görerek kurun. Çıktıyı [Agent adapter'ları ve hook'lar](/docs/tr/guides/agent-adapters/#hookları-kurmak) sayfası gösterir.

```sh
nomux hooks install claude            # show the diff
nomux hooks install claude --apply    # write ~/.claude/settings.json
nomux hooks status                    # installed, missing or different
nomux hooks uninstall claude --apply  # remove the hooks
```

- Her olay için bir girdi, `nomux` komutunu `hook claude <olay>` argümanlarıyla, shell olmadan çalıştırır. `nomux`, Claude Code'un `PATH`'inde olmalıdır.
- Ayar yolu Linux'ta ve macOS'ta aynıdır. Başka bir yapılandırma dizini kullanan (`CLAUDE_CONFIG_DIR`) bir Claude Code bu dosyayı okumaz: hook'ları orada elle kurun ya da dosyayı `claude --settings` ile verin.
- Claude Code'u bir nomux Session'ında başlatın. Hook komutu `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini Session'ın ortamından okur. Session'ın dışında `nomux hook` hiçbir şey yapmaz.

## nomux ne gösterir

İlk örnekte iki Session var. Birincide bir prompt, bir Bash çağrısı başlattı. İkincide turn bittikten sonra bir subagent hâlâ bir dosyayı okuyor.

```console
$ nomux status --tree
  SESSION              COMMAND                            STATE    FOR  MESSAGE
* am5cbfor             ./replay.sh /tmp/nomux-demo/fifo1  working  2s
+ t53mgmym             ./replay.sh /tmp/nomux-demo/fifo2  done     0s   1 task runs in the background
*   a45f24c823c444cb5                                     working  1s   read a.txt
```

İkinci Session `done` durumunda ve mesajı `1 task runs in the background`. Subagent'ı, çalışan bir Alt iştir. O bitince Session'ın mesajı kalmaz.

Sonra birinci Session bir izin ister:

```console
$ nomux status
  SESSION   COMMAND                            STATE                  FOR  MESSAGE
! am5cbfor  ./replay.sh /tmp/nomux-demo/fifo1  needs you: permission  0s   touch b.txt
+ t53mgmym  ./replay.sh /tmp/nomux-demo/fifo2  done                   0s   1 task runs in the background
$ nomux agent explain am5cbfor
session am5cbfor: needs you: permission for 0s, from adapter; message from adapter: touch b.txt

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

Adapter şunları gösterir:

- Agent çalışmasının durumu: `working`, türüyle birlikte `needs you` (`permission`, `question` veya `auth`), `done` ve `error`.
- Bir izin isteği için: aracı ve çağrının kısa bir ayrıntısı (komut, dosya yolu ya da URL), en fazla 160 bayt. Anahtar, token ya da parola gibi görünen bir sözcük `[hidden]` olarak gösterilir. Başka biçimdeki bir secret yine de bir komutun ayrıntısında görünebilir.
- Her subagent ve her takım arkadaşı, Alt iş olarak.
- Arka plandaki iş: biten turn'ün bir subagent'ı hâlâ çalışırken `1 task runs in the background` mesajıyla `done`.
- Çalışmanın ayrıntıları: Claude Code'un session kimliği, Claude Code gönderdiyse model ve bir resume komutu. Resume komutu `claude --resume <session>` içerir; `--model`, `--agent` ve `--permission-mode` seçeneklerini ise yalnızca güvenli değerlerle içerir. İzin kontrollerini atlayan ya da gevşeten bir modu (`bypassPermissions`, `auto`), bir prompt'u ya da bir ortam değişkenini asla içermez.

## Adapter'ın asla yapmadıkları

- Bir izin isteğini, bir elicitation'ı ya da bir soruyu sizin yerinize asla cevaplamaz. Her hook'un cevabı boştur.
- Claude Code'un izin modunu asla değiştirmez.
- Bir transcript'i, bir prompt'u, bir dosyanın içeriğini ya da bir aracın tam girdisini asla okumaz, saklamaz veya göndermez.
- Diskte hiçbir şey tutmaz. İhtiyacı olanı bellekte tutar; daemon onu 60 saniye olay gelmeden durdurunca da unutur.

## Bu sürümün sınırları

- Release yok. Extension'ı derler ve bir dizinden kurarsınız.
- Bu sayfadaki örnekler için Claude Code çalıştırılmadı: yukarıya bakın.
- Claude Code'un `SessionStart` olayında model her zaman olmaz. O zaman model değişene kadar ayrıntılarda model yoktur.
- Alt iş tek seviyedir: bir subagent'ın subagent'ı, Agent çalışmasının Alt işi olur.
- Bir Session'ın komutu `claude` ise ve komut biterse Session de biter. nomux onun son Agent çalışmasını ve resume komutunu saklar ([Biten Session'lar](/docs/tr/guides/agent-status/#biten-sessionlar)). Bir turn'ün hook verisinden ve `nomux kill`'den sonra `nomux agent explain` şu satırlarla biter:

  ```console
  $ nomux agent explain ehiz2fmv | tail -4

  from the adapter:
    tool session: 00000000-0000-4000-8000-000000000006
    resume: claude --resume 00000000-0000-4000-8000-000000000006
  ```

  Extension'ın README'si, nomux'un bu durumda hiçbir şey göstermediğini hâlâ söylüyor. O metin, nomux'un eski bir sürümünü anlatır.
- UI parçası yok. Desktop istemcisi henüz yok.
- Henüz yok: bir subagent'ın transcript'inden mevcut aracı ve son satırı, onay kartları için bir cevap (daemon bir hook'un cevabını Claude Code'a göndermez), `TeammateIdle` olayının ötesinde agent takımları, kullanım ve maliyet.

Her hook olayını bir duruma eşleyen kuralların tablosu [extension'ın README'sinde](https://github.com/nomux-sh/extensions/blob/main/agent-claude/README.md).
