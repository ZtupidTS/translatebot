# Google Translate ChatBot

This is a Workers script that processes the text sent to the bot from a Google Chat client and returns the translated result from Google Translate.

## Getting Started

Create a Google Chat bot by enabling the [Hangouts Chat API](https://developers.google.com/hangouts/chat/how-tos/bots-publish) in a project within your gSuite account.
Give it a name, description and icon.
This bot works in a DM as well as in a room, so you can tick both checkboxes.
In the connection settings, define the bot URL. This will be the route where the Workers should be deployed to .

![](https://faizazhar.com/projects/translate-bot/chat-api.png)

Next, enable the Cloud Translation API. This will enable you to use the paid/private `translate.googleapis.com` endpoint which is distinct from the free/public `translate.google.com` endpoint.

This is important to make sure the Terms of Service of G-Suite are applied for this feature, as opposed to the standard Google terms which dictates that everything including private data sent belongs to them to monetize:

>When you upload, submit, store, send or receive content to or through our Services, you give Google [...] a worldwide license to use, host, store, reproduce, modify, create derivative works [...], communicate, *publish, publicly perform, publicly display and distribute* such content.

Next, create an API key. We'll restrict this key to allow only calls to Cloud Translation and Hangout Chat API, but application level restrictions can also be configured.

![](https://faizazhar.com/projects/translate-bot/api-restrictions.png)

Add this API key as a Workers secret:

```
wrangler secret put GCP_API_KEY
```

Edit the `wrangler.toml` file, add your Cloudflare account ID and the URL route/zone ID where you want the Workers script to be deployed to.

The script can be deployed by running:

```
wrangler publish
```

You can also deploy this to a workers.dev by running:

```
wrangler publish --env dev
```

## How to use

- The first argument is the language to be translated to.
- The second argument is the sentence to translate from.
- When first argument is not specified, "en" will be assumed and the text will be translated to English by default.

To interact with the bot in a DM:

![](https://faizazhar.com/projects/translate-bot/dm.png)

To interact with the bot in a room, invite the bot and mention it's name:

![](https://faizazhar.com/projects/translate-bot/dm-room.png)

Translating to a non-English language:

![](https://faizazhar.com/projects/translate-bot/target-lang.png)

The Workers endpoint can also be called directly without using the Google Chat client. Here's an alias you can use:

```
translate () {
	translation_data='{"type": "MESSAGE","message":{"argumentText": "'$@'"}}'
	curl -sX POST https://faizazhar.com/projects/translate-bot/REDACTED -H "Content-Type:application/json" --data "${translation_data}" | jq .text
}
```

Call the function in a terminal:

```
translate ms i hope you enjoy this tutorial
"[en] saya harap anda menikmati tutorial ini"
```

