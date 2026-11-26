---
title: Projeler ve Gruplar
description: Çalıştığınız dizinleri Proje ve Grup ağacında toplayın, her Session'ın Projesini görün ve nomux status --tree ile bir Grubun en acil durumunu izleyin.
---

**Proje**, bir Host'ta adı olan bir dizindir. **Grup** ise adı olan ve Projeleri ve başka Grupları, istenen derinlikte içeren bir öğedir. İkisi birlikte Host'un **workspace ağacını** oluşturur: sırayı siz seçersiniz, ağacı daemon tutar.

Bir Session'ın çalışma dizini bir Projenin dizini ya da onun altındaki bir dizinse, Session o Projeye aittir. `nomux ls` her Session'ın Projesini gösterir, `nomux status --tree` ise her Projenin ve her Grubun ne yaptığını gösterir.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'taki gerçek çıktısıdır. Çalıştırmaların home dizini `/home/user` olarak gösterilir. Sizin kimlikleriniz ve process ID'leriniz farklı olur.

## Bir ağaç kurmak

`nomux group new` bir Grup oluşturur. `nomux project add` bir dizini Proje olarak ekler. Bu çalıştırmada üç dizin var: `acme-web`, `acme-api` ve `notes`.

```console
$ nomux group new "Client work"
made group vr7eyygu2jdk: Client work (revision 1)
$ nomux group new Acme --in "Client work"
made group beogp2b4pcrd: Client work/Acme (revision 2)
$ nomux project add ~/src/acme-web --group "Client work/Acme"
added project h2evg6lqw6s2: Client work/Acme/acme-web (revision 3)
$ nomux project add ~/src/acme-api --group Acme
added project 6pznv5rp7we7: Client work/Acme/acme-api (revision 4)
$ nomux project add ~/src/notes
added project xwhya26auf2n: notes (revision 5)
$ nomux group move notes --to Acme --before acme-web
moved xwhya26auf2n: Client work/Acme/notes (revision 6)
$ nomux group move Acme --to Acme
nomux: a Group cannot move into itself or into a Group below it
```

Her değişiklik tek satır yazdırır: ne değişti, düğümün kimliği, değişiklikten sonraki yolu ve ağacın **revizyonu**. Revizyon her değişiklikte 1 artar.

`nomux group ls --tree` ağacı listeler. Bir düğüm, Grubunun altında iki boşlukla girintilenir ve sizin seçtiğiniz sırada durur. `nomux project ls` yalnızca Projeleri listeler:

```console
$ nomux group ls --tree
NAME          KIND     ID            DIRECTORY
Client work   group    vr7eyygu2jdk  -
  Acme        group    beogp2b4pcrd  -
    notes     project  xwhya26auf2n  /home/user/src/notes
    acme-web  project  h2evg6lqw6s2  /home/user/src/acme-web
    acme-api  project  6pznv5rp7we7  /home/user/src/acme-api
$ nomux project ls
ID            PROJECT                    DIRECTORY
xwhya26auf2n  Client work/Acme/notes     /home/user/src/notes
h2evg6lqw6s2  Client work/Acme/acme-web  /home/user/src/acme-web
6pznv5rp7we7  Client work/Acme/acme-api  /home/user/src/acme-api
```

| Komut | Ne yapar |
|---|---|
| `nomux project add [<directory>] [--name <name>] [--group <node>]` | Proje ekler. Varsayılan ad, dizinin son parçasıdır. |
| `nomux project ls` | Projeleri listeler. |
| `nomux project rm <node>` | Bir Projeyi ağaçtan çıkarır. Dizin olduğu yerde kalır. |
| `nomux group new <name> [--in <group>]` | En üst seviyede ya da bir Grubun içinde Grup oluşturur. |
| `nomux group rename <node> <name>` | Bir Gruba ya da Projeye yeni ad verir. |
| `nomux group move <node> ...` | Bir Grubu ya da Projeyi taşır. `--to <group>`, `--top`, `--before <node>` ya da `--after <node>` gerekir. |
| `nomux group rm <node>` | Bir Grubu siler. İçindeki Gruplar ve Projeler onun yerine, üst Grubuna geçer. |
| `nomux group ls [--tree]` | Grupları ya da tüm ağacı listeler. |

`--quiet` yalnızca düğümün kimliğini yazdırır, `--json` tek bir JSON dokümanı yazdırır. `nomux tree` diye bir komut yoktur: `group ls --tree` ağacı listeler, `status --tree` ağacın durumunu gösterir.

## Bir düğümü adlandırmak

`<node>` alan bir komut üç biçimi kabul eder:

- 12 karakterlik **kimlik**: daemon üretir ve hiç değişmez;
- **yol**: en üst seviyeden düğüme kadar olan adlar, aralarında `/` ile; örneğin `Client work/Acme/acme-web`;
- yalnızca **ad**, onu tek bir düğüm taşıyorsa; örneğin `acme-web`.

İki düğümün adı aynı olabilir, aynı Grupta bile. Birden fazla düğümün taşıdığı bir ad ya da yol reddedilir ve komut adayları listeler. Proje isteyen bir komut Grup alırsa o da reddedilir:

```console
$ nomux project rm Acme
nomux: beogp2b4pcrd is a Group, not a Project
$ nomux project rm "Client work/Acme/notes"
removed project xwhya26auf2n: Client work/Acme/notes (revision 7)
$ nomux project add ~/src/notes --group Acme
added project rzikpltf6pjx: Client work/Acme/notes (revision 8)
```

Başka bir çalıştırmada `Acme` Grubundaki iki Projenin adı da `site` idi:

```console
$ nomux project rm Acme/site
nomux: "Acme/site" names 2 nodes: give the identifier of one
  vs2cb3pg4jhs  Acme/site
  yu2m2tkr23kr  Acme/site
```

`group rm` yalnızca Grubu siler. İçindekiler aynı sırayla bir üst seviyeye çıkar. Var olmayan bir düğüm 2 çıkış kodu verir.

## Proje eklemek

- **Varsayılan, geçerli dizindir.** Dizin vermeden `nomux project add`, komutu çalıştırdığınız dizini ekler.
- **Bir git reposunda Proje, reponun köküdür.** Komut `git rev-parse --show-toplevel` sorar. Burada `~/src/demo-repo/docs/guides` dizininde çalıştı:

  ```console
  $ cd ~/src/demo-repo/docs/guides
  $ nomux project add --name demo
  added project 6fil63rhd6gk: demo (revision 9)
  $ nomux project ls
  ID            PROJECT                    DIRECTORY
  h2evg6lqw6s2  Client work/Acme/acme-web  /home/user/src/acme-web
  6pznv5rp7we7  Client work/Acme/acme-api  /home/user/src/acme-api
  rzikpltf6pjx  Client work/Acme/notes     /home/user/src/notes
  6fil63rhd6gk  demo                       /home/user/src/demo-repo
  ```

  Projenin dizini `guides` değil, `demo-repo` olur. Kural, adını yazdığınız bir dizin için de geçerlidir. Yalnızca local Host'ta çalışır. `--host` ile dizin zorunludur ve uzak Host'ta mutlak bir yol olmalıdır.
- **Daemon dizini çözümler.** Her sembolik bağlantıyı çözer ve sonuç bir dizin olmalıdır. Proje çözümlenmiş yolu saklar.
- **Bir dizin, bir Proje.** Aynı dizinli ikinci bir Proje reddedilir. Bir Projenin dizini, başka bir Projenin dizininin altında olabilir.
- **Var olmayan bir dizin reddedilir.**

```console
$ nomux project add ~/src/demo-repo
nomux: the Project 6fil63rhd6gk has the directory /home/user/src/demo-repo already
$ nomux project add ~/src/nothing-here
nomux: the directory /home/user/src/nothing-here cannot be used: No such file or directory (os error 2)
```

## Bir Session'ın Projesi

Bir Session, dizini Session'ın çalışma dizinine eşit olan ya da onun üstünde kalan Projeye aittir. Birden fazla Proje uyuyorsa en uzun dizin kazanır. Karşılaştırma yolun tam parçalarıyla yapılır: `/src/app` Projesi `/src/app/web` dizinine uyar, `/src/application` dizinine uymaz.

Bir Session'ın Projesi varsa `nomux ls` çıktısında `PROJECT` sütunu olur; Projesi olmayan Session için `-` yazar. Bu çalıştırmada `archive`, `notes` Projesinin altındaki `notes/archive` dizininde bir Proje:

```console
$ nomux ls
ID        NAME     STATE    PID      PROJECT                    COMMAND
g4lqtfou  todo     running  4083550  Client work/Acme/notes     /bin/bash
le3wzbpq  old      running  4083577  Client work/Acme/archive   /bin/bash
mkdxuvtk  scratch  running  4083580  -                          /bin/bash
phzvucgt  web      running  4083547  Client work/Acme/acme-web  /bin/bash
y25xvaff  api      running  4083584  Client work/Acme/acme-api  /bin/bash
```

- `todo` `notes` dizininde, `old` `notes/archive` dizininde çalışıyor: `old` daha uzun eşleşmeyi alır.
- `web`, Projenin altındaki `acme-web/packages/ui` dizininde başladı.
- `scratch` home dizininde başladı; hiçbir Proje onu içermiyor.

Bir Session'ın Projesi, Session'ın bir alanı değildir. İstemci onu çalışma dizininden ve ağaçtan hesaplar; bu yüzden yalnızca ağaç değiştiğinde değişir.

### Sembolik bağlantılar

Daemon bir Session'ın çalışma dizinini, Session'ı ilk kez tanımlarken bir kez çözümler ve çözümlenmiş yolu Projelerin dizinleriyle karşılaştırır. Bir Proje dizinine giden sembolik bağlantıda başlayan Session o Projeye aittir:

```console
$ ln -s ~/src/acme-web ~/link-web
$ nomux new -n via-link --cwd ~/link-web
gkdxutgo
$ nomux ls
ID        NAME      STATE    PID      PROJECT                    COMMAND
gkdxutgo  via-link  running  4083585  Client work/Acme/acme-web  /bin/bash
```

(Gerçek çıktıda çalıştırmanın öbür Session'ları da vardı. Bu blokta yoklar.)

Daemon dizini çözümleyemezse Session Projesini kaybedebilir. Daemon, yeniden başladıktan sonra Session'ı yeniden bulduğunda yolu yine çözümler. Bir çalıştırmada bir Session bir bağlantıda başladı, sonra daemon durdu ve bağlantı silindi. Yeni daemon yolu çözümleyemedi. Session'a verilen yolu, yani bağlantıyı kullandı; bağlantı hiçbir Projeye uymaz: `ls`, `PROJECT` için `-` gösterdi.

nomux'un dokümanları bir durum daha verir: macOS'ta `/tmp`, `/private/tmp` dizinine giden bir bağlantıdır. Bu sayfa için denenmedi, çünkü bir Mac gerekir.

## Bir ağacın durumunu görmek

`nomux status --tree` Session'ları Projelerinin ve Gruplarının altında gösterir. Bir Grup ya da Proje, altındaki Session'ların **en acil durumunu** gösterir: Projenin Session'ları ya da Gruptaki ve onun altındaki her Gruptaki her Projenin Session'ları. İlk sırada `needs you` gelir. Durumların sırası [Agent durumu](/docs/tr/guides/agent-status/) sayfasında.

Bir agent aracı olmadan `idle` dışında bir durum elde etmek için bu çalıştırmadaki Session'lar `nomux status set` ile durum bildirdi ([Agent durumu](/docs/tr/guides/agent-status/#kendi-programınızdan-durum-bildirmek)). Komutlar `nomux send` ile dışarıdan geldi:

```console
$ nomux send web 'nomux status set working "build"'
$ nomux send api 'nomux status set blocked "run the tests?"'
$ nomux send todo 'nomux status set done "notes saved"'
$ nomux status --tree
  NAME          COMMAND    STATE      FOR  MESSAGE
  scratch       /bin/bash  idle       2s
! Client work/             needs you  1s   run the tests?
!   Acme/                  needs you  1s   run the tests?
*     acme-web             working    1s   build
*       web     /bin/bash  working    1s   build
!     acme-api             needs you  1s   run the tests?
!       api     /bin/bash  needs you  1s   run the tests?
+     notes                done       1s   notes saved
+       todo    /bin/bash  done       1s   notes saved
      archive              idle       2s
        old     /bin/bash  idle       2s
  demo                     -          -
```

- Projesi olmayan Session'lar en başta gelir. Sonra her Grup (adı `/` ile biter) ve her Proje, ağacın sırasıyla ve her seviye için girintili olarak gelir.
- `Client work/` ve `Acme/` `needs you` gösterir, çünkü altlarındaki `api` sizi bekliyor. `acme-web` `working` gösterir, çünkü altında yalnızca `web` var.
- Session'ı olmayan bir Grubun ya da Projenin durumu `-` olur: `demo` satırına bakın.
- İlk sütunun başlığı `NAME`'dir. Adı olan bir Session adıyla görünür.

## Değişiklikleri izlemek

Ağaçtaki her değişiklik bir olay üretir. `nomux events --follow --filter workspace-changed` olayları yazdırır. İkinci bir terminalde çalıştırma bir Grup oluşturdu, adını değiştirdi ve sildi:

```console
$ nomux events -f --filter workspace-changed
19 workspace revision 19: added con6zsta4tjz "Temp" at position 4
20 workspace revision 20: renamed con6zsta4tjz to "Temp2"
21 workspace revision 21: removed con6zsta4tjz
```

Öndeki sayı olayın sıra numarasıdır. `--json` her satıra tek bir JSON dokümanı yazar; dokümanda değişiklik ve yeni düğüm bulunur.

## Ağacın dosyası

Daemon ağacı state dizinindeki `workspace.json` dosyasında tutar: Linux'ta `~/.local/state/nomux`, macOS'ta `~/Library/Application Support/nomux`. Dosyanın modu `0600`'dür. Daemon yeni dosyayı yanına yazar, sonra yeniden adlandırır; bu yüzden Host'un durması eski ağacı ya da yeni ağacı bırakır, hiçbir zaman yarım bir ağacı bırakmaz.

Daemon dosyayı yalnızca başlarken, bir kez okur. Dosyaya güvenmez. Daemon'un kullanamadığı bir dosya daemon'u durdurmaz ve daemon onu silmez:

- Dosyayı `workspace.json.<milliseconds>.damaged` adıyla yeniden adlandırır.
- Nedenini log'una bir uyarı olarak yazar.
- Boş bir ağaçla başlar. Yeni ağacın revizyonu, Unix epoch'tan bu yana geçen milisaniyedir; çünkü kaybolan ağacın revizyonu bilinmez ve revizyon hiçbir zaman azalmamalıdır.

Burada dosyanın içeriği `{ not json` idi. Log satırı kısaltıldı (zamanı yok, home dizini yerine `/home/user` var):

```console
$ nomux group ls --tree
the workspace tree is empty
$ ls ~/.local/state/nomux
sessions
workspace.json.1795705667151.damaged
$ nomux group new Fresh
made group fd5phc26fnb2: Fresh (revision 1795705667152)
```

```text
WARN nomuxd::workspace::tree_file: the daemon cannot use the workspace tree file: it keeps the file aside and starts with an empty tree file=/home/user/.local/state/nomux/workspace.json kept=/home/user/.local/state/nomux/workspace.json.1795705667151.damaged reason="key must be a string at line 1 column 3"
```

Daemon, saklanan dosyayı bir daha okumaz. Onu elle okuyabilir ya da onarabilirsiniz.

## Limitler

| Limit | Değer | Mesaj |
|---|---|---|
| Ağaçtaki düğümler | 800 | `nomux: the workspace tree has 800 nodes, the limit: remove a node first` |
| Bir ad | 1 ile 128 bayt, kontrol karakteri olmadan | `nomux: the name has 129 bytes: 128 bytes is the limit`, `nomux: the name is empty`, `nomux: the name has a control character` |
| Bir dizin | En fazla 1024 baytlık mutlak yol, UTF-8 | |

Ürünün ölçümlerine göre, 800 düğümlük bir ağaçla boşta duran daemon yaklaşık 8 MB resident bellek kullanır.

## Bu sürümün yapmadıkları

- **Kaybolan bir Proje dizini için kontrol yok.** Daemon bir dizini siz eklediğinizde ekler ve bir daha bakmaz. Bir çalıştırmada bir Projenin dizini `rmdir` ile silindi. `nomux project ls` Projeyi yine listeledi ve yeniden başlayan daemon da onu yine tuttu. Böyle bir Projeyi `nomux project rm` ile çıkarın.
- **Projeye varsayılan agent ve renk verilemiyor.** Planlanıyor.
- **Desktop istemci Grupları henüz göstermiyor.** Kenar çubuğundaki, Grubu açıp kapatan ve durumunu gösteren grup satırı henüz yayımlanmadı.

[CLI başvurusunda](/docs/tr/reference/cli/) seçenekler ve JSON dokümanları var. Terimler [Sözlük](/docs/tr/reference/glossary/) sayfasından gelir. Ürünün [`docs/workspace.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/workspace.md) dokümanı ağacın modelini ve kurallarını anlatır.
