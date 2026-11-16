# AI Template — развёртывание из образов Docker Hub

Ветка `prod_ready` содержит только то, что нужно для запуска из готовых образов: compose-файл,
пример `.env`, три скрипта для базы и эту инструкцию. Исходный код проекта лежит в `main`
(и в `prod`, это снимок `main` на момент публикации).

Образы публикуются в Docker Hub:

- `morro665065/ai-template-backend`
- `morro665065/ai-template-frontend`

Теги: `prod` (текущий релиз), `prod-<коммит>` (неизменяемая копия релиза),
`prod-YYYYMMDD` (предыдущий релиз, нужен для отката). Тег `latest` не публикуется.

Стек состоит из четырёх контейнеров: `frontend` (Nginx + React), `backend` (NestJS + Prisma),
`postgres` (база), `adminer` (просмотр базы). Данные живут в именованных томах Docker:
`ai_template_postgres_data` (база) и `ai_template_backups` (копии из админки).

Все команды ниже запускаются из каталога, где лежат `docker-compose.deploy.yml` и `.env.deploy`.

---

## Сценарий А. Новая установка

Нужны Docker Engine (или Docker Desktop) и Docker Compose v2: `docker compose version`.

1. Получите файлы ветки:

   ```bash
   git clone --branch prod_ready https://github.com/MichailLis/AI_Template.git
   cd AI_Template
   cp .env.deploy.example .env.deploy
   ```

2. Заполните `.env.deploy`. Обязательно замените:

   - `POSTGRES_PASSWORD` и тот же пароль внутри `DATABASE_URL`;
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (длинные случайные строки, например
     `openssl rand -hex 32`);
   - `CORS_ALLOWED_ORIGINS` — адрес, по которому откроют сайт, например `https://prof.example.ru`;
   - `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` — первый администратор;
   - `APP_HTTP_PORT` (на сервере обычно `80`) и, если нужен ИИ-анализ, `AI_API_KEY`.

   Ключ ИИ хранится только в `.env.deploy` на сервере, не в репозитории и не во frontend.

3. Запустите:

   ```bash
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
   docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
   ```

   Через 1–2 минуты `postgres`, `backend`, `frontend` должны быть `healthy`. Миграции базы
   применяются сами при старте backend (`RUN_DB_MIGRATIONS=true`).

4. Проверьте:

   ```bash
   curl -f http://localhost:${APP_HTTP_PORT:-8080}/health
   ```

   Откройте `http://<адрес>/login` и войдите под `BOOTSTRAP_ADMIN_EMAIL` /
   `BOOTSTRAP_ADMIN_PASSWORD`. Adminer — на порту `ADMINER_PORT` (его лучше не открывать наружу).

5. После первого входа смените пароль администратора и уберите `BOOTSTRAP_ADMIN_PASSWORD` из
   `.env.deploy`.

---

## Сценарий Б. Обновление уже работающей установки

Том базы при обновлении не пересоздаётся, но миграции меняют схему, а часть из них удаляет
колонки (что именно в этом релизе — в шаге «Проверка»). Поэтому **всё начинается с копии базы**:
без неё обновлять нельзя.

Команды `docker compose down -v`, удаление тома `ai_template_postgres_data` и смена
`POSTGRES_VOLUME_NAME` на новое имя уничтожают или «теряют» данные. В этой инструкции их нет, и
выполнять их не нужно.

### 1. Копия базы

```bash
sh scripts/backup-db.sh
```

Скрипт кладёт файл `db-backups/db-ГГГГММДД-ЧЧММСС.dump`, проверяет, что он читается, и печатает его
имя. Если он пишет «ОШИБКА», дальше не идите.

Скопируйте файл с сервера на другую машину (например, `scp`): том Docker живёт на том же диске, что
и база.

Заодно запишите число строк в таблицах, чтобы сравнить после обновления:

```bash
sh scripts/db-counts.sh > counts-before.txt
cat counts-before.txt
```

Перед этим релизом проверьте, что в базе нет попыток со статусом `ABANDONED` (новый релиз убирает
этот статус, и миграция остановится, если такие строки есть):

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA' <<'SQL'
SELECT count(*) FROM test_student_attempts WHERE status::text = 'ABANDONED';
SQL
```

Должно быть `0`. Если число другое, не обновляйте и напишите разработчикам.

### 2. Новые файлы развёртывания

Если сервер стоит на `prod_ready` (или на `prod`), файлы `docker-compose.deploy.yml` и
`.env.deploy.example` в этих ветках одинаковые:

```bash
git fetch origin
git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)"
```

Если `git pull` ругается на локальные изменения, остановитесь и не делайте `reset --hard`: ваш
`.env.deploy` в git не входит, а конфликт значит, что кто-то правил tracked-файлы на сервере.

Если файлы на сервер копировали вручную, а не через git, скачайте `docker-compose.deploy.yml` и
`.env.deploy.example` из ветки `prod_ready` заново. Старый compose с новыми образами не запускается:
backend остаётся `unhealthy`, а frontend падает с `dependency failed to start`.

Убедитесь, что compose новый, прежде чем идти дальше:

```bash
grep -n "3000/health" docker-compose.deploy.yml
```

Команда должна вывести строку healthcheck. Если она ничего не выводит, а в файле есть `/api-json`,
compose старый: в production Swagger (`/api-json`) выключен, и проверка здоровья по нему никогда не
пройдёт.

С прошлого релиза (`prod-5b3efb0`, 03.11.2026) `docker-compose.deploy.yml` и `.env.deploy.example`
не менялись, правок в `.env.deploy` не требуется. Если сервер обновляется с релиза 12.10.2026 или
более раннего, в compose с тех пор изменилось:

- healthcheck backend проверяет `GET /health` вместо `/api-json`;
- Adminer публикуется только на `127.0.0.1` (`ADMINER_PORT`), снаружи его открывают через
  SSH-туннель: `ssh -L 8081:127.0.0.1:8081 user@SERVER_IP`;
- добавлен том `ai_template_backups` с копиями базы из админки (создаётся сам);
- переменные ИИ называются `AI_*`. Старые `OPENROUTER_API_KEY` и `OPENROUTER_DEFAULT_MODEL`
  продолжают работать и передаются как раньше; таймауты `OPENROUTER_*_TIMEOUT*` больше не
  передаются, действуют значения по умолчанию (`AI_TIMEOUT_MS` и `AI_PROF_ORIENTATION_*`).

Новые необязательные переменные описаны в `.env.deploy.example`: `AI_*`, `BACKUP_*`,
`BACKUPS_VOLUME_NAME`. Пока их нет в `.env.deploy`, действуют значения по умолчанию.

### 3. Обновление

В `.env.deploy` должно быть `APP_IMAGE_TAG=prod`.

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml pull
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

`up -d` без списка сервисов пересоздаёт каждый контейнер, у которого сменился образ или настройки
в compose, включая Adminer. Если перечислить только `backend frontend`, Adminer останется со старой
публикацией порта (`0.0.0.0:8081`).

Том с базой не меняется, даже если контейнер PostgreSQL пересоздаётся (так бывает при обновлении
с релиза 12.10.2026 и раньше): данные остаются в томе. При старте backend сам применяет новые
миграции.

В `ps` у `postgres`, `backend` и `frontend` должно быть `healthy`, а у `adminer` порт
`127.0.0.1:8081->8080/tcp` (не `0.0.0.0`).

### 4. Проверка

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs backend | grep -i -E "migration|error"
curl -f http://localhost:${APP_HTTP_PORT:-8080}/health
sh scripts/db-counts.sh > counts-after.txt
diff counts-before.txt counts-after.txt
```

Ожидаемо:

- в логе «All migrations have been successfully applied»;
- `health` отвечает `200`;
- `diff` при обновлении с релиза 03.11.2026 показывает только: новую таблицу `ai_usage_events`
  (0 строк), четыре новые записи в `_prisma_migrations` и последнюю миграцию
  `20261116100000_add_anonymous_entry_profile_mode`. Число строк в остальных таблицах
  (пользователи, тесты, ссылки, прохождения, ответы) не меняется;
- две осознанные правки схемы без потери строк: `20261106110000` удаляет колонку
  `analysis_prompt_versions.outputSchema`, `20261106100000` пересоздаёт тип статуса попытки без
  значения `ABANDONED`.

Старый образ не работает с базой после этих миграций, поэтому при откате восстановите копию из
шага «Копия базы». Обновляйте, когда тесты никто не проходит.

С этого релиза backend проверяет `.env.deploy` при старте: числовые переменные (`AI_TIMEOUT_MS`,
`ANALYSIS_LLM_CONCURRENCY`, `BACKUP_*` и т. п.) должны быть числом или пустыми. Если в логе backend
`Invalid environment configuration`, исправьте названную там переменную и повторите `up -d`.

Затем в браузере: вход в админку, раздел аналитики, «Настройки → Резервные копии» (кнопка
«Создать копию»), публичная ссылка `/t/<код>`.

### 5. Откат, если что-то пошло не так

1. Верните прежние образы. В `.env.deploy` поставьте:

   ```env
   APP_IMAGE_TAG=prod-20261103
   ```

   (Это образы, которые работали до обновления. Тег `prod` уже указывает на новый релиз.)

2. Восстановите базу из копии, снятой на шаге 1:

   ```bash
   sh scripts/restore-db.sh db-backups/db-ГГГГММДД-ЧЧММСС.dump
   ```

   Скрипт просит ввести `RESTORE`, останавливает backend и frontend, пересоздаёт базу, заливает
   копию и запускает контейнеры заново. Данные, появившиеся после копии, пропадут.

3. Проверьте: `sh scripts/db-counts.sh | diff counts-before.txt -`.

---

## Полезное

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f backend frontend
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
docker compose --env-file .env.deploy -f docker-compose.deploy.yml down      # остановить, данные остаются
```

Резервные копии из админки («Настройки → Резервные копии») и их восстановление описаны в
`docs/deployment-dockerhub.md` основной ветки (раздел 11).

Порты: `APP_HTTP_PORT` открывает frontend (Nginx), `ADMINER_PORT` — Adminer. Backend слушает `3000`
только внутри сети Docker; чтобы сменить внешний порт, меняйте `APP_HTTP_PORT`, а не `PORT`.

Рядом с работающим стеком можно поднять отдельный для проверки: задайте в отдельном env-файле
другие `APP_HTTP_PORT`, `ADMINER_PORT`, `*_CONTAINER_NAME`, `POSTGRES_VOLUME_NAME`,
`BACKUPS_VOLUME_NAME` и запускайте с `--project-name <имя> --env-file <файл>`.
