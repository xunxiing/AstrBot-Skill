import { defineConfig } from "vitepress";
import fs from "node:fs";
import path from "node:path";

type SidebarItem = {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
};

const docsRoot = path.resolve(__dirname, "..", "docs");

const DIR_LABELS: Record<string, string> = {
  agent: "Agent",
  design_standards: "设计规范",
  messages: "消息",
  platform_adapters: "平台适配",
  plugin_config: "插件配置",
  "Storage & Utils": "存储与工具",
  storage: "存储",
  snapshots: "快照",
};

function prettyName(stem: string): string {
  return stem
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function listMarkdownLinks(dirAbs: string, linkPrefix: string): SidebarItem[] {
  if (!fs.existsSync(dirAbs)) return [];
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const items: SidebarItem[] = [];

  // Prefer index.md first if present.
  if (files.includes("index.md")) {
    items.push({ text: "概览", link: `${linkPrefix}/` });
  }

  for (const name of files) {
    if (name === "index.md") continue;
    const stem = name.slice(0, -3);
    items.push({ text: prettyName(stem), link: `${linkPrefix}/${stem}` });
  }

  return items;
}

function buildSnapshotsSidebar(): SidebarItem | null {
  const snapshotsDir = path.join(docsRoot, "snapshots");
  if (!fs.existsSync(snapshotsDir)) return null;

  const versions = fs
    .readdirSync(snapshotsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => b.localeCompare(a));

  const versionItems: SidebarItem[] = [];
  for (const v of versions) {
    const vDir = path.join(snapshotsDir, v);
    const categoryDirs = fs
      .readdirSync(vDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    const categories: SidebarItem[] = [];
    for (const cat of categoryDirs) {
      const catDir = path.join(vDir, cat);
      const prefix = `/snapshots/${v}/${cat}`;
      const label = DIR_LABELS[cat] || prettyName(cat);
      const links = listMarkdownLinks(catDir, prefix);
      if (links.length) {
        categories.push({ text: label, items: links, collapsed: true });
      }
    }

    versionItems.push({
      text: v,
      link: `/snapshots/${v}/`,
      items: categories,
      collapsed: true,
    });
  }

  return {
    text: DIR_LABELS.snapshots,
    link: "/snapshots/",
    items: versionItems,
    collapsed: true,
  };
}

function buildSidebar(): SidebarItem[] {
  const groups: SidebarItem[] = [];

  const topDirs = fs
    .readdirSync(docsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  for (const dir of topDirs) {
    if (dir === "snapshots") continue;
    const dirAbs = path.join(docsRoot, dir);
    const label = DIR_LABELS[dir] || prettyName(dir);
    const links = listMarkdownLinks(dirAbs, `/${dir}`);
    if (!links.length) continue;
    groups.push({ text: label, items: links, collapsed: false });
  }

  const snapshots = buildSnapshotsSidebar();
  if (snapshots) groups.push(snapshots);

  return groups;
}

export default defineConfig({
  title: "AstrBot Docs",
  description: "AstrBot 开发文档",
  srcDir: "docs",
  base: process.env.VITEPRESS_BASE || "/",
  themeConfig: {
    nav: [
      { text: "核心概念", link: "/design_standards/core_concepts" },
      { text: "Agent", link: "/agent/" },
      { text: "消息模型", link: "/messages/model" },
      { text: "插件配置", link: "/plugin_config/schema" },
      { text: "平台适配", link: "/platform_adapters/adapter_interface" },
    ],
    sidebar: buildSidebar(),
  },
});
