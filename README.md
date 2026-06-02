# Slack Hebrew RTL Lite

Lightweight right-to-left Hebrew support for Slack.

This is a WXT browser extension that runs on Slack workspaces and adjusts Slack UI surfaces when Hebrew text is detected. It keeps the extension small: one content script, one stylesheet, and localized manifest strings.

## Features

- Detects Hebrew text in Slack messages, attachments, search results, saved items, canvases, and composers.
- Applies RTL direction and right-aligned text where Hebrew is dominant.
- Keeps mixed Hebrew/English content readable by preserving LTR treatment for usernames, timestamps, code, links, and similar inline UI elements.
- Includes English and Hebrew extension metadata.

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

- `entrypoints/slack.content/index.ts` scans Slack DOM updates and marks Hebrew or mixed-direction elements.
- `entrypoints/slack.content/style.css` applies the RTL layout fixes for marked elements.
- `public/_locales/` contains localized manifest strings.
- `wxt.config.ts` defines extension manifest metadata.

## Loading Locally

After running `pnpm build`, load the generated extension from WXT's output directory in your browser's extensions page. For Chromium-based browsers, use "Load unpacked" and select the built Chrome MV3 output directory under `.output`.
