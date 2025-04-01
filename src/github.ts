import { Octokit } from "octokit";
import { REPO_NAME, REPO_OWNER } from "./util.ts";

interface ResolvedBase {
    number: number;
    link: string;
    title: string;
    body: string | null;
    isOpen: boolean;
    creator: string;
    createdAt: Date;
}

export interface ResolvedIssue extends ResolvedBase {
    kind: "issue";
    closedType: "completed" | "duplicate" | "not_planned" | null;
}

export interface ResolvedPull extends ResolvedBase {
    kind: "pull";
    isMerged: boolean;
}

export type ResolvedRef = ResolvedIssue | ResolvedPull;

const octokit = new Octokit();

async function fetchPull(num: number): Promise<ResolvedPull> {
    const { data } = await octokit.rest.pulls.get({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        pull_number: num,
    });

    return {
        kind: "pull",
        number: data.number,
        link: data.html_url,
        title: data.title,
        body: data.body,
        isOpen: data.state === "open",
        creator: data.user.login,
        createdAt: new Date(data.created_at),
        isMerged: data.merged,
    };
}

async function fetchIssue(num: number): Promise<ResolvedIssue> {
    const { data } = await octokit.rest.issues.get({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: num,
    });

    const closedStateReason = data.state_reason as Exclude<
        typeof data.state_reason,
        "reopened"
    >;

    return {
        kind: "issue",
        number: data.number,
        link: data.html_url,
        title: data.title,
        body: data.body ?? null,
        isOpen: data.state === "open",
        creator: data.user?.login ?? "unknown",
        createdAt: new Date(data.created_at),
        closedType: data.state === "closed" ? closedStateReason ?? null : null,
    };
}

export async function fetchReference(num: number): Promise<ResolvedRef | null> {
    try {
        return await fetchPull(num);
    } catch {
        try {
            return await fetchIssue(num);
        } catch {
            return null;
        }
    }
}
