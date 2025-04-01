export const REPO_OWNER = "tobspr-games";
export const REPO_NAME = "shapez-community-edition";
export const REFERENCE_REGEX = /\B#\d+(?=\W|$)/gm;

export const discordToken = process.env["DISCORD_TOKEN"];
if (discordToken === undefined) {
    throw new Error("Missing DISCORD_TOKEN environment variable");
}

const channelsVar = process.env["MONITORED_CHANNELS"];
if (channelsVar === undefined || channelsVar.match(/[^,0-9]/)) {
    throw new Error("No channel IDs to monitor found in MONITORED_CHANNELS");
}

export const monitoredChannels = channelsVar.split(",");

export function extractReferences(message: string): number[] {
    const matches = message.match(REFERENCE_REGEX);
    return (matches ?? [])
        .map((ref) => Number(ref.slice(1)))
        .filter((number) => !isNaN(number));
}
