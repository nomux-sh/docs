---
title: Hazırda bekletme ve bellek limiti
description: Daemon boştaki bir agent'ı ne zaman durdurur ve Session'ı saklar, nomux wake ve nomux attach agent'ı nasıl yeniden başlatır, ayarlar ve bellek limitinin Linux'ta ve macOS'te nasıl çalıştığı.
---

Boştaki bir agent boşuna bellek tutar. **Hazırda bekletme** bu belleği geri verir: daemon, boşta duran bir agent Session'ının agent'ını durdurur ve Session'ı saklar; çıktısı ve agent'ın **devam komutu** yerinde kalır. Session'ı açtığınızda daemon devam komutunu çalıştırır ve agent konuşmasına kaldığı yerden devam eder. Buna **uyandırma** denir.

**Bellek limiti**, aynı soruna başka bir çözümdür. Bir Session'ın belleğini sınırlar. İşletim sistemi limiti uygulayabiliyorsa, limite ulaşan Session'ın process'lerini sonlandırır. Uygulayamıyorsa limit, hazırda bekletmenin eşiği olur.

[Session'ların belleği](/docs/tr/guides/session-memory/) sayfası nomux'un belleği nasıl ölçtüğünü anlatır.

## Bu sayfa için ne çalıştırıldı

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'taki gerçek çıktısıdır. Çalıştırmaların home dizini `/home/user` olarak gösterilir. Sizin kimlikleriniz ve process ID'leriniz farklı olur. Tek bir Session gösteren blok, tek bir çalıştırmadan gelir.

**Agent bir taklittir.** Çalıştırmalarda gerçek Claude Code kullanılmadı; çünkü hesap ve para gerekir. Session, `claude` adlı küçük bir Python script'i çalıştırdı (script bu sayfanın sonunda). Script şunları yapar:

- Bir agent gibi 150 MiB bellek tutar;
- `nomux hook claude <event>` ile hook olayları gönderir. JSON'da adapter'ın okuduğu alanlar var. Gerçek Claude Code'un verisinde daha fazla alan olur;
- terminalden satır başına bir kelime okur (`work`, `stop`, `idle` ya da `ask`) ve o kelimenin olayını gönderir; böylece çalıştırmalar için model gerekmedi;
- `--resume <id>` ile başlarsa `resumed session <id>` yazdırır.

Adapter gerçektir: `extensions` reposunun release'indeki `nomux.agent-claude` 0.1.0 extension'ı; `nomux ext install <dizin> --grant-all` ile kuruldu. Hook'lar, durum, devam komutu, tetikleyiciler, durdurma ve uyandırma nomux'un gerçek koddur. Çalıştırmaların göstermediği şey: gerçek bir Claude Code ile onun gerçek açılış süresi ve konuşması. Taklit, daemon'un `PATH`'indedir; gerçek bir çalıştırmada `claude` da orada olur.

## Hazırda bekletme ne yapar

```console
$ nomux new -n agent --cwd ~/project -- claude
57anosge
$ nomux send agent work
$ nomux send agent stop
$ nomux status
  SESSION  COMMAND  STATE  FOR  MESSAGE
+ agent    claude   done   1s
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
57anosge  running  159.5 MiB  1          432.0 KiB  pss      -      -      claude
total: 159.5 MiB in 1 process of 1 session, and 432.0 KiB in the holders (pss)
$ nomux hibernate agent
session 57anosge hibernated: 159.5 MiB given back (pss)
$ nomux ls
ID        NAME   STATE       PID  COMMAND  NOTE
57anosge  agent  hibernated  -    claude   request
$ nomux status
  SESSION  COMMAND  STATE                FOR  MESSAGE
+ agent    claude   hibernated: request  1s
$ nomux ls --memory
ID        STATE       MEMORY  PROCESSES  HOLDER  MEASURE  LIMIT  FREED      COMMAND
57anosge  hibernated  -       -          -       -        -      159.5 MiB  claude
total: no session has a process
hibernated: 159.5 MiB given back by 1 session
```

- `nomux hibernate <target>` bir Session'ı hemen hazırda bekletir ve geri verdiği belleği yazdırır. Bu bellek, komutun process ağacının, durdurmadan hemen önce ölçülen belleğidir.
- `nomux ls` durumu `hibernated` olarak gösterir. Not alanında neden yazar: `count`, `session-memory`, `total-memory`, `memory-pressure` ya da `request`.
- `nomux status`, durumun yerinde `hibernated: <reason>` gösterir.
- `nomux ls --memory` iki sütun daha gösterir: `LIMIT` ve `FREED`. `FREED`, hazırda bekletmenin geri verdiği bellektir. Son satırda toplamı var.
- Session çıktısını saklar; bu yüzden `nomux capture` hâlâ çalışır. Daemon hazırda bekletmenin ayrıntılarını Session'ın state dizinindeki `hibernation` dosyasında tutar; `--json` bunları gösterir (bu satır başka bir çalıştırmadan):

```json
"hibernation":{"hibernated_at":1795705812,"reason":"request","freed_bytes":165303296,"measure":"pss","resume_command":"claude --resume 00000000-0000-4000-8000-000000000001","woken_at":null,"wake_error":null}
```

Control protocol'ün JSON'unda, hazırda bekleyen bir Session'ın durumu `dormant`'tır ve bu ek alan vardır. Alanı bilmeyen bir istemci uykudaki bir Session görür; bu doğrudur, çünkü Session'ın process'i yoktur.

nomux dokümanları durdurmayı dört adımda anlatır. Daemon belleği ölçer. `hibernation` dosyasını yazar. Holder'dan ekranın bir checkpoint'ini ister. Sonra `agents.stop_signals` sinyallerini komuta sırayla gönderir ve her birinden sonra `agents.stop_wait` kadar bekler. İlki `SIGHUP`'tır: agent onu terminalin sonu sayar ve konuşmasını yazar. Durdurma tamamlanmazsa daemon dosyayı siler ve Session eskisi gibi devam eder.

## Agent'ı yeniden başlatmak

Üç komut, hazırda bekleyen bir Session'ın devam komutunu başlatır:

- `nomux wake <target>` devam komutunu Session'ın çalışma dizininde başlatır ve komutu yazdırır.
- `nomux attach <target>` aynısını yapar ve attach eder. Önce eski ekranı, sonra nomux'tan bir satır, sonra devam eden çalışmayı gösterir.
- `nomux start <target>` da devam komutunu başlatır; uykudaki bir Session'ı başlattığı gibi. Bir çalıştırmada `session agent (4bpf7tuo) runs` yazdırdı ve `ls` komut olarak `claude --resume 00000000-0000-4000-8000-000000000001` gösterdi. Uyandırma hakkında mesaj vermez. `nomux wake`, hazırda beklemeyen bir Session'da hata verir; `nomux hibernate` de hazırda bekleyemeyen bir Session'da hata verir.

```console
$ nomux wake agent
session agent (57anosge) woke: claude --resume 00000000-0000-4000-8000-000000000001
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
57anosge  running  159.3 MiB  1          470.0 KiB  pss      -      -      claude --resume 00000000-0000-4000-8000-000000000001
total: 159.3 MiB in 1 process of 1 session, and 470.0 KiB in the holders (pss)
$ nomux capture agent --lines 3
stop
done
stand-in claude: resumed session 00000000-0000-4000-8000-000000000001
```

Hazırda bekleyen bir Session'a attach ettiğinizde terminalde şunu görürsünüz (gerçek çıktıda kaçış dizileri ve parçalar arasında boş satırlar da var):

```text
stand-in claude: new session 00000000-0000-4000-8000-000000000001
--- nomux: the session started again. The output before this line is from the command that stopped ---
stand-in claude: resumed session 00000000-0000-4000-8000-000000000001
```

Uyandırılan Session'ın komutu devam komutudur. O biterse Session de biter. İlk çalışmada bir shell varsa, o shell geri gelmez.

Uyandırma başarısız olursa Session hazırda bekler durumda kalır. Komutun çıkış kodu 1'dir ve mesajda elle çalıştırılacak komut vardır. Burada daemon, `PATH`'inde `claude` olmadan başlamıştı:

```console
$ nomux wake agent
nomux: session 57anosge did not wake: the program claude is not in PATH. To continue its agent by hand, run this command in /home/user/project: claude --resume 00000000-0000-4000-8000-000000000001
$ nomux ls
ID        NAME   STATE       PID  COMMAND                                               NOTE
57anosge  agent  hibernated  -    claude --resume 00000000-0000-4000-8000-000000000001  request; wake failed: the program claude is not in PATH
```

## Hangi Session'lar hazırda bekler

Bir Session otomatik olarak yalnızca şunların **hepsi** doğruysa hazırda bekler. `nomux hibernate` aynı listeye bakar; yalnızca yıldızlı iki satır dışında.

| Koşul | Neden |
|---|---|
| Adapter'ı Session'ı bir agent Session olarak ve bir devam komutuyla bildirdi | Devam komutu olmazsa durdurmak konuşmayı kaybettirir. |
| Durum `idle`, `done` (görülmüş ya da görülmemiş) ya da `prompt` türünde `needs you` | Hiçbir şey çalışmıyor ve agent'ın istediği hiçbir şey beklemiyor. |
| Durum `working` değil | Çalışan iş kaybolurdu. |
| Durum `permission`, `question` ya da `auth` türünde `needs you` değil | Devam etmek, agent'ın beklediği şeyi kaybettirir. |
| Durum `error` değil | Hatayı, oluştuğu process'te görmelisiniz. |
| Hiçbir istemci Session'ı göstermiyor | Siz ona bakıyorsunuz. |
| Durumun son değişikliğinden sonra girdi gelmedi | Girdi satırında agent'ın almadığı bir metin olabilir. |
| Session'ı sabitlemediniz (`nomux pin`) * | Onu dışarıda tuttunuz. |
| `agents.hibernate_after` süresince boşta: durumun son değişikliğinden ve son detach'ten beri * | Yakında geri dönebilirsiniz. |

`nomux hibernate` hangi koşulun tutmadığını söyler. Aşağıdakiler çalıştırmaların mesajlarıdır; Session'ın kimliği yerine `<id>` yazıldı:

| Session | Mesaj |
|---|---|
| Düz bir shell | `nomux: session <id> cannot hibernate: no adapter reports it as an agent session` |
| Çalışan bir agent | `nomux: session <id> cannot hibernate: its agent works` |
| İzin bekleyen bir agent | `nomux: session <id> cannot hibernate: its agent waits for a permission answer` |
| Cevap bekleyen bir agent | `nomux: session <id> cannot hibernate: its agent waits for an answer of the user` |

`done` sonucu sonuç olarak kalır: hazırda bekleyen Session onu ve görüldü işaretini saklar.

### Bir Session'ı sabitlemek

`nomux pin <target>` bir Session'ı her **otomatik** hazırda bekletmenin dışında tutar. `nomux unpin <target>` bunu geri alır. `nomux ls` `pinned` notunu gösterir:

```console
$ nomux new -n shell --cwd ~/project
d7jc3ygl
$ nomux hibernate shell
nomux: session d7jc3ygl cannot hibernate: no adapter reports it as an agent session
$ nomux pin shell
session shell (d7jc3ygl) is pinned
$ nomux ls
ID        NAME   STATE    PID      COMMAND    NOTE
d7jc3ygl  shell  running  3938505  /bin/bash  pinned
$ nomux unpin shell
session shell (d7jc3ygl) is not pinned
$ nomux wake shell
nomux: session shell is not hibernated: `nomux start shell` starts a dormant session
```

Sabitlemenin `nomux hibernate` üzerinde etkisi yoktur: sabitlenmiş bir Session'ı elle hazırda bekletebilirsiniz. Bu bilgi nomux dokümanlarından gelir ve bu sayfa için çalıştırılmadı: bunu deneyen çalıştırmalardaki Session bir agent Session değildi ([Bilinen sınırlar](#bilinen-sınırlar)).

## Session'ı ne hazırda bekletir

Daemon beş tetikleyici uygular. Onları daemon'un tek bir görevi uygular. Görev yoklama yapmaz: olay günlüğünden bir olay, bir detach, kernel'den bellek baskısı raporu ve bir Session'ın yeterince uzun süre boşta kalacağı an için tek bir zamanlayıcı onu uyandırır.

| Tetikleyici | Ne zaman | Hangi Session'lar | Neden |
|---|---|---|---|
| Sayı | Canlı agent Session sayısı `agents.max_live` değerini aşıyor | En uzun süredir boşta olan önce, sayı limite inene kadar | `count` |
| Tek Session'ın belleği | `sessions.memory_limit` tanımlı, işletim sistemi onu uygulamıyor ve bir Session daha fazla kullanıyor | O Session | `session-memory` |
| Tüm Session'ların belleği | `sessions.total_memory_limit` tanımlı ve Session'lar daha fazla kullanıyor | En uzun süredir boşta olan önce, toplam limitin altına inene kadar | `total-memory` |
| Bellek baskısı | `agents.hibernate_on_pressure` true ve kernel, process'lerin 2 s'lik bir pencerede 200 ms bellek beklediğini bildiriyor (yalnızca Linux) | En uzun süredir boşta olan Session | `memory-pressure` |
| İstek | `nomux hibernate <target>` | O Session | `request` |

Her hazırda bekletme ve her uyandırma bir olay üretir. `nomux events --follow --filter session-hibernated --filter session-woken --filter session-wake-failed` olayları yazdırır. Aşağıdaki çalıştırmalar kısa bir `hibernate_after` ile hızlandırıldı.

**Sayı.** Yapılandırmada `max_live = 1` ve `hibernate_after = "5s"` vardı. İki agent Session `done` durumundaydı. En uzun süredir boşta olan Session hazırda bekledi. Sonra bir attach onu uyandırdı:

```toml
[agents]
max_live = 1
hibernate_after = "5s"
```

```console
$ nomux events -f --filter session-hibernated --filter session-woken
5 gi5k2hn2 hibernated (count, 2 live agents, limit 1): 157.5 MiB given back
7 gi5k2hn2 woke: claude --resume 00000000-0000-4000-8000-000000000001
```

**Tüm Session'ların belleği.** Yapılandırmada `total_memory_limit = "200M"` ve `hibernate_after = "5s"` vardı. İki agent Session birlikte 312.7 MiB kullandı:

```console
$ nomux events -f --filter session-hibernated
2 ttmaxdni hibernated (total-memory, 312.7 MiB used, limit 200.0 MiB): 156.4 MiB given back
4 tface77n hibernated (memory-pressure, 200 ms waited for memory in 2000 ms): 156.6 MiB given back
```

İkinci satır planlanmamıştı. Çalıştırmanın yapıldığı bilgisayar başka programlarla meşguldü, kernel bellek baskısı bildirdi ve daemon ikinci Session'ı da hazırda bekletti. Bu satır, çalıştırmanın bilerek oluşturmadığı bellek baskısı tetikleyicisini gösterir: 2000 ms'lik bir pencerede 200 ms bellek beklemesi.

**Tek Session'ın belleği** platforma bağlı olduğu için sonraki bölümde. **İstek**, bu sayfanın ilk bloğundaki `nomux hibernate`'tir: olayı `5 57anosge hibernated (request): 157.0 MiB given back`. Başarısız bir uyandırma şu olayı üretir: `2 57anosge did not wake: the program claude is not in PATH; resume command: claude --resume 00000000-0000-4000-8000-000000000001`.

## Ayarlar

Ayarlar yapılandırma dosyasında. Linux'ta dosya `~/.config/nomux/config.toml`'dir. macOS'ta `~/Library/Application Support/nomux/config.toml`'dir. `XDG_CONFIG_HOME` mutlak bir yolsa, iki sistemde de `$XDG_CONFIG_HOME/nomux/config.toml`'dir. `nomux daemon status`, daemon'un okuduğu yolu yazdırır. Daemon dosyayı açılışında bir kez okur; bu yüzden bir değişiklik daemon'un sonraki açılışından sonra geçerli olur.

```toml
[sessions]
memory_limit = "4G"            # one Session: K, M or G; no key: no limit
total_memory_limit = "16G"     # all Sessions together; no key: no limit

[agents]
max_live = 12                  # live agent Sessions; 0 turns the count trigger off
hibernate_after = "60s"        # the idle time before a Session can hibernate
hibernate_on_pressure = true   # the memory pressure of the Host is a trigger
stop_signals = ["HUP", "TERM", "KILL"]
stop_wait = "5s"               # the time after each signal
```

| Anahtar | Varsayılan | Anlamı |
|---|---|---|
| `sessions.memory_limit` | yok | Tek bir Session'ın limiti. |
| `sessions.total_memory_limit` | yok | Tüm Session'ların toplam limiti. Her zaman hazırda bekletmenin eşiğidir, hiçbir zaman işletim sisteminin limiti değildir. |
| `agents.max_live` | `12` | Daemon'un tuttuğu canlı agent Session sayısı. |
| `agents.hibernate_after` | `60s` | Bir agent'ın hazırda bekleyebilmesi için ne kadar boşta kalması gerektiği. |
| `agents.hibernate_on_pressure` | `true` | Bellek baskısı bir tetikleyicidir (yalnızca Linux). |
| `agents.stop_signals` | `HUP`, `TERM`, `KILL` | Durdurma sinyalleri, bu sırayla. Liste `KILL` ile bitmelidir; böylece durdurma her zaman sona erer. |
| `agents.stop_wait` | `5s` | Her sinyalden sonraki bekleme. Agent'ın konuşmasını diske yazması için bu süreye ihtiyacı var. |

Geçersiz bir değer, daemon'un log'unda anahtarı belirten bir hata verir ve daemon her varsayılanı kullanır. Varsayılanlar ürünün varsayılanlarıdır. Bu sayfadaki çalıştırmalar `hibernate_after`, `max_live` ve limitleri yalnızca saniyeler içinde cevap almak için değiştirdi.

## Bellek limiti

`sessions.memory_limit`, bir Session'ın process'lerinin kullanabileceği en fazla bellektir. Daemon Host'u açılışında bir kez inceler. `nomux daemon status` sonucu `memory limit:` ile başlayan bir satırda gösterir.

| Host | `sessions.memory_limit` ne yapar |
|---|---|
| systemd kullanıcı yöneticisi, sürüm 2 control group'lar ve memory controller olan Linux | **Limiti kernel uygular.** Holder komutu, `MemoryMax` olan bir systemd kullanıcı scope'unda başlatır. Session'ın process'leri limite ulaşınca kernel hepsini `SIGKILL` ile sonlandırır. Diğer Session'lar, holder ve daemon devam eder. |
| Bunlar olmayan Linux | **İşletim sisteminin limiti yok.** Limit bir eşiktir: onun üstündeki boşta bir agent Session hazırda bekler. |
| macOS | **İşletim sisteminin limiti yok.** macOS'te ayrıcalık olmadan bir process ağacının belleğini sınırlayan açık bir arayüz yok. Limit bir eşiktir. |

### systemd kullanıcı yöneticisi olan Linux

Çalıştırmaların Host'u budur. Durum satırı, limiti kernel'in uyguladığını söyler:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4106719, 1 session
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

`memory_limit = "100M"` iken `ls --memory`, Session'ın limitini `LIMIT` sütununda gösterir. Hazırda bekleyen Session'ın satırında `-` var:

```console
$ nomux ls --memory
ID        STATE       MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT      FREED      COMMAND
5upfkwg5  hibernated  -          -          -          -        -          159.5 MiB  claude --resume 00000000-0000-4000-8000-000000000001
mjpaf37b  running     751.0 KiB  1          948.0 KiB  pss      100.0 MiB  -          /bin/bash
total: 751.0 KiB in 1 process of 1 session, and 948.0 KiB in the holders (pss)
hibernated: 159.5 MiB given back by 1 session
```

Taklit 150 MiB tutar. Taklitle ve aynı limitle açılan yeni bir Session hayatta kalmadı:

```console
$ nomux events -f --filter session-memory-limit-reached
2 avvp5doe ended at its memory limit of 100.0 MiB
$ nomux ls --all | grep -E 'ID|big'
ID        NAME    STATE    PID      COMMAND                                               NOTE
avvp5doe  big     ended    -        claude                                                signal 9
```

Daemon'un log'unda tek bir uyarı var: `the kernel ended the session at its memory limit`; Session kimliği ve bayt cinsinden limit de yazıyor. Daemon böyle bir Session'ı hazırda bekletmez: limitte olan bir Session iş yapıyor olabilir ve kernel onu zaten sonlandırdı.

- Limit, `ls --memory`'nin saymadığı belleği sayar: kernel'in process'ler için kullandığı bellek ve onların okuduğu dosyaların page cache'i. Bir Session, `ls --memory` daha azını gösterirken limitine ulaşabilir. Kernel bir process'i sonlandırmadan önce page cache'i boşaltır.
- Limit, zaten çalışan bir holder'a uygulanmaz. Yeni değer, daemon'un sonraki açılışından sonra başlayan Session'lara ve geri yüklenen bir uykudaki Session'a uygulanır.
- `memory_limit` varken [holder havuzu](/docs/tr/guides/holder-pool/) kapalıdır; çünkü havuzdaki bir shell Session'ından önce başlar, yani limitsiz başlar. `memory_limit = "100M"` ve `"2G"` ile yapılan çalıştırmalarda `~/.nomux/run` içinde `.pool` dizini yoktu.
- Limitli bir Session'ın başlaması yaklaşık 4,6 ms daha uzun sürer. Bu sayı, nomux dokümanlarındaki tasarım ölçümüdür. Limitsiz bir Session'da bu maliyet yoktur.

### systemd kullanıcı yöneticisi olmayan Linux

Daemon kullanıcı yöneticisine ulaşamazsa limit yalnızca bir eşiktir. Daemon'un ortamından `XDG_RUNTIME_DIR` ve `DBUS_SESSION_BUS_ADDRESS` çıkarılarak yapılan bir çalıştırma şu satırı verdi:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4009414, 0 sessions
memory limit: the operating system applies no limit (the daemon cannot reach the systemd user manager: it has no DBUS_SESSION_BUS_ADDRESS and no $XDG_RUNTIME_DIR/bus); a limit is a threshold for the hibernation of an idle agent session
configuration file: /home/user/.config/nomux/config.toml
```

Log'da, daemon'un açılışında aynı nedeni içeren tek bir uyarı var. Taklit sonra 157.6 MiB kullandı; bu, 100M limitin üstünde. Daemon boşta olduğunda onu hazırda bekletti (`memory_limit = "100M"` ve `hibernate_after = "5s"`):

```console
$ nomux events -f --filter session-hibernated
2 6ybmawen hibernated (session-memory, 157.6 MiB used, limit 100.0 MiB): 157.6 MiB given back
$ nomux status | tail -1
  agent    claude   hibernated: session-memory  15s
```

[Hangi Session'lar hazırda bekler](#hangi-sessionlar-hazırda-bekler) bölümündeki koşullar geçerlidir: yalnızca hazırda bekleyebilen bir agent Session aday olur.

### macOS

nomux dokümanları şunu söyler: macOS'te işletim sisteminin limiti yoktur; `memory_limit` ve `total_memory_limit` eşiktir. Bellek ölçüsü `rss`'tir. Bellek baskısı tetikleyicisi macOS'te yoktur: bunun için [#100 numaralı issue](https://github.com/nomux-sh/nomux/issues/100) açık. Sayı ve eşikler çalışır. **Bu sayfa için çalıştırılmadı**, çünkü bir Mac gerekir.

### `daemon status` ve `host doctor`

`nomux daemon status` local Host için `memory limit:` satırını gösterir. `nomux host doctor`, uzak bir Host için `memory-limit` kontrolüne sahiptir; bu bilgi nomux dokümanlarından gelir. Kontrol bu sayfa için **çalıştırılmadı**: komut yalnızca `nomux host add` ile eklenmiş bir Host için çalışır, bunun için bir SSH sunucusu gerekir ve çalıştırmaların yapıldığı bilgisayarda `nomux host doctor` `no hosts` dedi. Kontrolleri [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfası anlatır.

## Yeniden başlatmadan sonra

Hazırda bekleyen bir Session'ın process'i yoktur; bu yüzden Host'un yeniden başlaması onu değiştirmez. Daemon hazırda bekleyen bir Session'ı kendi açılışında **geri yükleme politikası `auto` olsa bile** hiçbir zaman başlatmaz: Session belleğini sizin için geri verdi. Bu çalıştırmada Session'ın politikası `auto` idi; sonra her nomux process'i, bir yeniden başlatmanın yaptığı gibi `kill -9` ile sonlandı:

```console
$ nomux restore-policy agent auto
session agent (57anosge) has the restore policy auto
$ nomux ls
ID        NAME   STATE       PID  COMMAND  NOTE
57anosge  agent  hibernated  -    claude   request
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4106719, 1 session
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

`ls`, yeni daemon başladıktan sonra çalıştı: Session hâlâ hazırda bekliyor ve hiçbir şey agent'ını başlatmadı. Sonra `nomux wake agent` onu başlattı: bu, [Agent'ı yeniden başlatmak](#agentı-yeniden-başlatmak) altındaki bloktaki `wake` komutudur. Diğer Session'lar için [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfasına bakın.

## nomux'un hiçbir zaman yapmadıkları

- Bir Session'ı belleği yüzünden hiçbir zaman sonlandırmaz. Bunu yalnızca kernel yapar, sizin koyduğunuz bir limitte.
- Yukarıdaki koşullar olmadan, bir tetikleyici için hiçbir Session'ı hazırda bekletmez.
- Devam komutunu hiçbir zaman bir shell'e vermez. Komut bir extension'dan gelen metindir. Daemon onu yalnızca POSIX shell'in tırnak kurallarıyla (tek tırnak, çift tırnak ve ters bölü) kelimelere böler ve ilk kelimeyi program olarak başlatır. Operatör, genişletme, glob karakteri, yorum, `~`, satır sonu ya da kapanmamış tırnak içeren bir komut başlamaz: uyandırma bir nedenle başarısız olur. Bu bilgi nomux dokümanlarından gelir ve bu sayfa için çalıştırılmadı.
- Devam komutunu hiçbir zaman değiştirmez ve ona kelime eklemez. Claude Code adapter'ı, kontrolleri atlayan bir izin modunu komuttan çıkarır.
- Hazırda bekleyen bir Session'ı daemon açılırken hiçbir zaman başlatmaz.

## Bilinen sınırlar

- **Adapter 0.1.0 ile dinlenen bir Claude Code Session'ı hazırda beklemez.** Claude Code, yaklaşık 60 saniye girdi gelmeyince `idle_prompt` bildirimini gönderir. Yayımlanan adapter bunu `needs you: question` olarak bildirir. `question`, bir cevap beklemektir; bu yüzden Session aday olmaz. Bir çalıştırmada:

  ```console
  $ nomux status | tail -1
  ! agent2   claude                                                needs you: question  0s   Claude is waiting for your input
  $ nomux hibernate agent2
  nomux: session ku4v2yaq cannot hibernate: its agent waits for an answer of the user
  ```

  `extensions` reposunun `main` branch'inde bu bildirim için `needs you: prompt` bildiren bir değişiklik var ve README yeni davranışı anlatıyor. **Değişiklik bir release'te yok.** Reponun README'si 0.1.0 release'inin önündedir. Bugün bir Claude Code Session'ı yalnızca bu bildirim gelmeden önce hazırda bekler (bir turun bitişinden sonraki ilk dakika). Daha fazlası için [Agent adapter'ları](/docs/tr/guides/agent-adapters/) ve [Claude Code](/docs/tr/guides/claude-code/) sayfalarına bakın.
- **Uyandırılan bir Session kısa bir süre yeniden hazırda bekleyemeyebilir.** Birkaç çalıştırmada bir Session, son hook olayından sonra bir dakikadan kısa sürede uyandı. Devam eden çalışma `working` ve `done` bildirdi; ama `nomux agent explain` çıktısında `from the adapter` satırları yoktu ve `nomux hibernate` `no adapter reports it as an agent session` dedi. Son olayla uyandırma arasında 70 saniye bekleyen bir çalıştırma satırları gösterdi ve Session yeniden hazırda bekledi. Neden ayrıştırılamadı. Adapter gönderdiği ayrıntıları kendi belleğinde tutar ve host, adapter'ı olaysız 60 saniye sonra durdurur; bu, çalıştırmalarda görülenle uyuşuyor. nomux dokümanları ilgili bir açık noktayı da sayar: bir program, daemon Session'ın token'ını almadan önce hook gönderirse reddedilir; bu yüzden hemen bildirim gönderen devam eden bir agent'ın bir sonraki hook'una kadar ayrıntıları olmayabilir. Taklit, ilk olayından önce bu yüzden 4 saniye bekler; bu, etkiyi ortadan kaldırmadı.
- **`host doctor` ve macOS çalıştırılmadı.** Yukarıya bakın.
- **Sabitlenmiş bir agent Session ile `nomux hibernate` birlikte çalıştırılmadı.** Sabitleme kuralı nomux dokümanlarından gelir.
- **Durdurma sinyalleri gerçek bir agent ile çalıştırılmadı.** Taklit konuşma yazmaz. Gerçek bir agent'ın konuşmasını `stop_wait` içinde bitirip bitirmediği burada denenmedi.
- **macOS'te bellek baskısı.** [#100 numaralı issue](https://github.com/nomux-sh/nomux/issues/100).
- **Limit, kernel'in ölçüsüdür.** `ls --memory`, limitin saydığından daha azını gösterebilir.

## Taklit

Çalıştırmalardaki Session bu script'i `claude` olarak çalıştırdı. Claude Code değildir ve hiçbir modelle konuşmaz:

```python
#!/usr/bin/env python3
import json, os, subprocess, sys, time

SESSION = "00000000-0000-4000-8000-000000000001"
if len(sys.argv) > 2 and sys.argv[1] == "--resume":
    SESSION = sys.argv[2]
    print("stand-in claude: resumed session " + SESSION, flush=True)
else:
    print("stand-in claude: new session " + SESSION, flush=True)

held = bytearray(150 * 1024 * 1024)
for i in range(0, len(held), 4096):
    held[i] = 1

def hook(event, **extra):
    data = {"session_id": SESSION, "cwd": os.getcwd(), "hook_event_name": event}
    data.update(extra)
    subprocess.run(["nomux", "hook", "claude", event], input=json.dumps(data).encode(), check=False)

time.sleep(4)
hook("SessionStart", source="resume" if len(sys.argv) > 2 else "startup")
for line in sys.stdin:
    word = line.strip()
    if word == "work":
        hook("UserPromptSubmit", prompt="x", permission_mode="default")
        print("working", flush=True)
    elif word == "stop":
        hook("Stop")
        print("done", flush=True)
    elif word == "idle":
        hook("Notification", notification_type="idle_prompt", message="Claude is waiting for your input")
        print("at the prompt", flush=True)
    elif word == "ask":
        hook("Notification", notification_type="permission_prompt", message="Claude needs your permission")
        print("waiting for permission", flush=True)
```

Çalıştırmalar kelimeleri `nomux send agent stop` ve benzeri komutlarla gönderdi. [Claude Code](/docs/tr/guides/claude-code/) sayfası `extensions` reposundaki gerçek hook verisini gösterir, [Agent adapter'ları](/docs/tr/guides/agent-adapters/) sayfası bir hook olayının yolunu anlatır.

Kuralları ve kararı ürünün [`docs/memory.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/memory.md) dokümanı ve [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md) içerir. Terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir.
