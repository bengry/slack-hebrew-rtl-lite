# Slack Hebrew RTL Lite

Lightweight right-to-left Hebrew support for Slack.

This is a WXT browser extension for Chromium browsers (Chrome, Edge) that gives every line of Slack text its own direction and alignment, the way a Google Docs or Word paragraph does. Slack's own layout (avatars, gutter, actions) stays left-to-right; only text flips.

## Features

- Per-line direction in messages, threads, DMs and full search results: each line of a multi-line message resolves from its own first strong character; single-line text uses word majority (Hebrew, Arabic and other RTL scripts).
- List items and quotes take their own direction; bullets, numbers and the quote bar follow each item's side.
- Code, inline code and URLs stay left-to-right and isolated; mentions, channels and emoji are isolated.
- Composer (new and edit): each line resolves its own direction as you type.
- Direction marks: a line that starts with Latin but is mostly Hebrew (for example `PR #123 עודכן`) gets an invisible RLM on send, so receivers see it right-to-left. `Ctrl+[` forces the caret's line LTR, `Ctrl+]` forces it RTL; press again to return to auto. The LTR / RTL buttons in the composer toolbar do the same.
- Copying from messages strips the line-leading direction marks.
- Search snippets and Saved/Later previews get one direction per preview.

## Development

Install dependencies:

```sh
vp install
```

Run the extension in development mode:

```sh
vp run dev
```

Build the extension:

```sh
vp run build
```

Create a distributable zip:

```sh
vp run zip
```

Check formatting:

```sh
vp fmt --check .
```

Format files:

```sh
vp fmt .
```

## Project Structure

- `entrypoints/slack.content/index.ts` wires up the content script.
- `entrypoints/slack.content/direction.ts` holds the direction rule (`directionOf`, first strong character, automatic marks).
- `entrypoints/slack.content/render.ts` sets `dir` and line mode on Slack's text containers.
- `entrypoints/slack.content/observer.ts` batches DOM mutations per animation frame and renders only the touched containers.
- `entrypoints/slack.content/marks.ts` inserts and removes direction marks in the composer through `execCommand`.
- `entrypoints/slack.content/composer.ts` handles the shortcuts, the toolbar buttons and the on-send hook.
- `entrypoints/slack.content/copy.ts` strips direction marks when copying messages.
- `entrypoints/slack.content/style.css` holds the per-line, list, quote, island and composer rules.
- `scripts/check-direction.mjs` self-checks the direction rule (`node scripts/check-direction.mjs`).
- `public/_locales/` contains localized manifest strings.
- `wxt.config.ts` defines extension manifest metadata.

## Loading Locally

After running `vp run build`, load the generated extension from WXT's output directory in your browser's extensions page. For Chromium-based browsers, use "Load unpacked" and select `.output/chrome-mv3`.
