# landing-keepsake-vite

Лендінг студії **Keepsake** (той самий макет, що в lab-07), зібраний за професійним фронтенд-процесом: **Vite + Pug + SCSS**, PostCSS (Autoprefixer + Browserslist), адаптивні зображення AVIF/WebP/JPEG та автоматичний контроль якості (Prettier, Stylelint, husky, lint-staged).

**Демо:** https://<ВАШ_ЛОГІН>.github.io/landing-keepsake-vite/

> Без фреймворків і UI-бібліотек. Мобільне меню та фільтр портфоліо працюють на чистому CSS (`:checked ~`), JavaScript на сторінці немає.

## Вимоги до середовища

- Node.js LTS (не нижче 20), npm 10+
- Git

```bash
node -v
npm -v
```

## Команди

| Команда           | Що робить                                                                           |
| ----------------- | ----------------------------------------------------------------------------------- |
| `npm install`     | Встановлює залежності та вмикає git-хуки (`prepare` запускає husky)                 |
| `npm run dev`     | Dev-сервер Vite (Pug і SCSS компілюються на льоту)                                  |
| `npm run build`   | Продакшн-збірка в `dist/`: HTML з Pug, CSS з SCSS + PostCSS (мініфікує Vite), хеші  |
| `npm run preview` | Локальний перегляд збірки з `dist/`                                                 |
| `npm run format`  | Форматує весь проєкт Prettier-ом                                                    |
| `npm run lint`    | `lint:styles` (Stylelint по `src/**/*.scss`) + `lint:format` (`prettier --check .`) |
| `npm run images`  | sharp: `images-src/*` -> `src/assets/images/<name>-<width>.{avif,webp,jpg}`         |

## Структура проєкту

```
landing-keepsake-vite/
├── .github/workflows/deploy.yml   # CI: lint + build + деплой на GitHub Pages
├── .husky/                        # pre-commit (lint-staged), commit-msg (commitlint)
├── images-src/                    # вихідні зображення для npm run images
├── scripts/images.js              # sharp: AVIF/WebP/JPEG у двох ширинах
├── src/
│   ├── assets/images/             # результат npm run images (комітиться)
│   ├── components/                # header.pug, footer.pug, sections/*.pug
│   ├── data/                      # дані секцій: масиви об'єктів у Pug
│   ├── includes/                  # fonts, meta, svg-sprite
│   ├── layouts/main.pug           # базовий макет (extends / block)
│   ├── mixins/                    # Pug-міксини
│   ├── pages/index.pug            # сторінка: extends + перевизначення блоків
│   └── styles/
│       ├── abstracts/             # токени (map-и), rem(), mq(), міксини
│       ├── base/                  # :root, reset, типографіка, utilities
│       ├── layout/                # container, section, header, footer
│       ├── components/            # один БЕМ-блок - один файл
│       └── main.scss              # єдина точка входу
├── .browserslistrc
├── postcss.config.js
├── .stylelintrc.json / .prettierrc / .prettierignore / .lintstagedrc.json
└── vite.config.js
```

## Архітектура Pug

- **Наслідування.** `layouts/main.pug` задає каркас і блоки `meta`, `title`, `styles`, `content`, `scripts`; `pages/index.pug` робить `extends` і перевизначає їх.
- **`append` / `prepend`.** `append meta` додає description і Open Graph; `prepend styles` ставить шрифти _перед_ основною таблицею стилів; `append scripts` додає JSON-LD.
- **`include`.** Шапка, футер, кожна секція та SVG-спрайт - окремі файли.
- **Дані.** Повторювані блоки (навігація, категорії, роботи, послуги, статистика, журнал, клієнти, колонки футера, соцмережі) лежать у `src/data/*.pug` як масиви об'єктів.
- **`each` з індексом.** Усе повторюване виводиться через `each item, i in items`; розмітка картки пишеться один раз. Радіокнопки й чипси фільтра теж генеруються з масиву `categories`.
- **Міксини** (`src/mixins/`):

  | Міксин                                    | Особливості                                                                   |
  | ----------------------------------------- | ----------------------------------------------------------------------------- |
  | `+btn(label, href, variant)`              | `case/when` для варіанта; `block` для іконки; `&attributes`; `<a>`/`<button>` |
  | `+icon(name, width, height)`              | `case/when` підбирає розмір; `&attributes`; `<use>` зі спрайта                |
  | `+picture({...})`                         | `<picture>` AVIF/WebP/JPEG, `srcset`/`sizes`, `width`/`height`, `lazy`        |
  | `+work-card(work, i)`                     | картка роботи; перша картка без `lazy`, з `fetchpriority="high"`              |
  | `+section(id, title, desc)`               | приймає вкладений вміст через `block` і класи через `&attributes`             |
  | `+service-card`, `+journal-card`, `+stat` | решта карток; `+socials(items)` - соцмережі                                   |

- **Умови, `case`, інтерполяція.** `if/else` (`+btn`, `+section`), `unless` (robots у meta), `case/when` (`+btn`, `+icon`), `#{...}`, `${...}` в атрибутах, клас за умовою `class={ 'nav__link--active': link.active }`, службові коментарі `//-`.

### Як працює фільтр робіт (без JS)

Радіокнопки `.works__radio` є **сусідами** `.works__head` і `.works__grid`, тому CSS вибирає їх через `:checked ~`. У `components/_works.scss` цикл `@each` по `$filter-slugs` генерує правила для кожної категорії. Селектори йдуть за атрибутами (`[value='print']`), а не за `id`, бо Stylelint забороняє `id` (`selector-max-id: 0`).

> Якщо додаєте категорію, оновіть і `categories` у `src/data/works.pug`, і `$filter-slugs` у `src/styles/abstracts/_variables.scss`.

## Архітектура SCSS

- **Лише `@use` / `@forward`.** Кожна папка має `_index.scss`, що реекспортує partials через `@forward`; компоненти підключають абстракції через `@use '../abstracts' as *`. `main.scss` - єдина точка входу.
- **Токени.** Кольори, шрифти, розміри та брейкпоінти - map-и в `abstracts/`. Кольори й шрифти через `@each` перетворюються на `--color-*` / `--font-*` у `:root` (`base/_root.scss`); у компонентах - `var(--color-...)`.
- **Mobile first.** Міксин `mq($bp)` бере значення з map-а `$breakpoints` (`sass:map`) і містить лише `min-width`. «Сирих» `@media (min-width)` у компонентах немає.
- **Функція.** `rem($px)` на `math.div`.
- **Міксини.** `visually-hidden`, `focus-ring($color, $offset)` (параметри за замовчуванням), `flex-center($direction, $display)`, `uppercase-label($size, $spacing, $weight)`, `reduced-motion`.
- **БЕМ.** `&__element`, `&--modifier`, стани через `&:hover`, `&:focus-visible`, `&:checked ~`. Вкладеність ≤ 3, без `id` і `!important` (перевіряє Stylelint).
- **Вендорні префікси** вручну не пишуться - їх додає Autoprefixer.

## Використані інструменти

| Інструмент                                       | Навіщо                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| **Vite**                                         | Dev-сервер і збірка: хеші, переписування шляхів у `url()`/`srcset`, `base` |
| **Pug** (`vituum` + `@vituum/vite-plugin-pug`)   | Шаблонізатор: `.pug` -> HTML                                               |
| **Sass (Dart Sass)**                             | Препроцесор: map-и, міксини, функції, модулі                               |
| **PostCSS + Autoprefixer**                       | Постпроцесор: вендорні префікси за списком Browserslist                    |
| **Browserslist**                                 | Список цільових браузерів (`.browserslistrc`)                              |
| **sharp**                                        | `npm run images`: конвертація й ресайз у AVIF/WebP/JPEG                    |
| **Prettier** + `@prettier/plugin-pug`            | Єдине форматування SCSS, Pug, JS, JSON, MD                                 |
| **Stylelint** + `stylelint-config-standard-scss` | Лінтинг SCSS: БЕМ-шаблон, вкладеність ≤ 3, без id та `!important`          |
| **husky** + **lint-staged**                      | `pre-commit`: лінтери лише на файлах, що потрапили в коміт                 |
| **commitlint**                                   | Перевірка повідомлень комітів (Conventional Commits)                       |
| **GitHub Actions**                               | `npm ci` -> `lint` -> `build` -> деплой на GitHub Pages                    |

Усі збиральні залежності (`vite`, `sass`, `vituum`, `@vituum/vite-plugin-pug`, `sharp`, лінтери) лежать у **devDependencies**: у браузер потрапляє лише зібраний `dist/`.

## Цільові браузери (Browserslist)

`.browserslistrc`: останні 2 версії Chrome, Firefox, Edge, Safari та iOS Safari.

```bash
npx browserslist
npx autoprefixer --info
```

Мініфікацію CSS у `npm run build` виконує сам Vite (`build.cssMinify`), окремий `cssnano` не потрібен. Autoprefixer потрібен окремо: мініфікатор Vite орієнтується на `build.target`, а не на Browserslist.

## Оптимізація: до / після

**Зображення** (13 файлів: 9 робіт 358x282 і 4 прев'ю 150x150; вимірювання `npm run images`):

| Варіант                          | Розмір   | Від вихідників |
| -------------------------------- | -------- | -------------- |
| Вихідні JPEG (`images-src/`)     | 214.0 KB | 100 %          |
| JPEG (mozjpeg, найбільша ширина) | 40.4 KB  | 19 %           |
| WebP (найбільша ширина)          | 22.5 KB  | 11 %           |
| AVIF (найбільша ширина)          | 17.4 KB  | 8 %            |

Браузер завантажує один файл: AVIF, якщо підтримує, інакше WebP, інакше JPEG. Потрібну ширину він вибирає за `srcset` і `sizes`.

**CSS** (заповніть після `npm run build`):

| Варіант                               | Розмір | gzip |
| ------------------------------------- | ------ | ---- |
| Вихід Sass (до PostCSS і мініфікації) | ...    | ...  |
| `dist/assets/*.css` (після збірки)    | ...    | ...  |

## Git: коміти й хуки

- Повідомлення комітів - за [Conventional Commits](https://www.conventionalcommits.org/uk/v1.0.0/) (`feat: ...`, `fix: ...`, `chore: ...`).
- `pre-commit` запускає `lint-staged`: для `.scss` - `stylelint --fix` і `prettier --write`; для `.pug`, `.js`, `.json`, `.md` - `prettier --write`. Коміт із помилкою Stylelint (клас `.Card_Title`, порожній блок) блокується.
- Хук можна обійти (`--no-verify`), тому `npm run lint` виконується ще й у CI.

## Публікація на GitHub Pages

1. У **Settings -> Pages -> Build and deployment -> Source** виберіть **GitHub Actions**.
2. Кожен пуш у `main` запускає `.github/workflows/deploy.yml`: `npm ci` -> `lint` -> `build` -> публікація `dist/`.
3. У `vite.config.js` задано `base: '/landing-keepsake-vite/'` для збірки, інакше стилі й зображення не завантажаться за адресою `https://<user>.github.io/landing-keepsake-vite/`.
4. Папка `dist` у репозиторій не комітиться.
