import {
    Client,
    GatewayIntentBits,
    hideLinkEmbed,
    hyperlink,
    strikethrough,
    time,
    TimestampStyles,
    unorderedList,
} from "discord.js";
import { fetchReference, type ResolvedRef } from "./github.ts";
import { discordToken, extractReferences, monitoredChannels } from "./util.ts";

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    allowedMentions: {
        parse: [],
    },
});

function formatReference(ref: ResolvedRef): string {
    let title: string = `#${ref.number}: ${ref.title}`;
    const createAction = ref.kind === "pull" ? "created" : "opened";

    const isClosed = !ref.isOpen && (ref.kind === "issue" || !ref.isMerged);
    if (isClosed) {
        title = strikethrough(title);
    }

    const createdAt = `${createAction} ${time(
        ref.createdAt,
        TimestampStyles.RelativeTime
    )} by ${ref.creator}`;

    const subtitle = [createdAt];
    if (ref.kind === "issue" && ref.closedType !== null) {
        // Add extra text for close reason, if needed
        subtitle.push(`closed as ${ref.closedType.replaceAll("_", " ")}`);
    }

    // NOTE: discord.js formatter doesn't format unordered lists properly
    const link = hideLinkEmbed(ref.link);
    return `${hyperlink(title, link)}\n ${subtitle.join(", ")}`;
}

bot.on("messageCreate", async (msg) => {
    if (!monitoredChannels.includes(msg.channelId) || msg.author.bot) {
        return;
    }

    const references = extractReferences(msg.cleanContent);
    if (references.length === 0) {
        return;
    }

    const resolved = await Promise.all(references.map(fetchReference));
    const formatted = resolved
        .filter((ref) => ref !== null)
        .map(formatReference);

    const list = unorderedList(formatted);
    const text = `Referenced issues and pull requests:\n${list}`;

    await msg.channel.send(text);
});

await bot.login(discordToken);
console.log("Logged in successfully");
