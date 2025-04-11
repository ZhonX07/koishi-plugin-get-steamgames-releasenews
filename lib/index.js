var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  name: () => name
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var name = "get-steamgames-releasenews";
var Config = import_koishi.Schema.object({
  maxLength: import_koishi.Schema.number().description("返回的内容的最大长度。如果为 0，返回完整内容。").default(0),
  count: import_koishi.Schema.number().description("要获取的文章数量").default(5)
});
function apply(ctx, config) {
  ctx.command("steam-games-update-news <gamecode:string>", "获取steam游戏更新新闻").option("count", "-c <count:number> 要获取的文章数量", { fallback: config.count }).option("length", "-l <length:number> 返回的内容的最大长度", { fallback: config.maxLength }).action(async ({ session, options }, gamecode) => {
    if (!gamecode) {
      return "请提供游戏代码 (AppID)";
    }
    try {
      const params = {
        appid: gamecode,
        count: options.count,
        maxlength: options.length
      };
      const response = await ctx.http.get("https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/", { params });
      const { appnews } = response;
      if (!appnews || !appnews.newsitems || !appnews.newsitems.length) {
        return "未找到该游戏的新闻";
      }
      let result = `《${appnews.appname || `AppID: ${gamecode}`}的最新更新》
${"=".repeat(30)}

`;
      for (let i = 0; i < appnews.newsitems.length; i++) {
        const news = appnews.newsitems[i];
        result += `【${i + 1}】${news.title}
`;
        const newsDate = new Date(news.date * 1e3);
        const formattedDate = `${newsDate.getFullYear()}年${newsDate.getMonth() + 1}月${newsDate.getDate()}日 ${newsDate.getHours()}:${newsDate.getMinutes().toString().padStart(2, "0")}`;
        result += `📅 ${formattedDate}

`;
        const cleanContent = cleanBBCode(news.contents);
        const processedContent = processImagesInContent(cleanContent);
        result += `${processedContent}
`;
        result += `🔗 ${news.url}
`;
        if (i < appnews.newsitems.length - 1) {
          result += `
${"-".repeat(30)}

`;
        }
      }
      await session.send(result.trim());
    } catch (error) {
      console.error("获取Steam游戏新闻失败:", error);
      return `获取游戏新闻失败: ${error.message || "未知错误"}`;
    }
  });
}
__name(apply, "apply");
function cleanBBCode(text) {
  if (!text) return "";
  return text.replace(/\[\/?list\]/g, "\n").replace(/\[\*\]/g, "• ").replace(/\[h1\](.*?)\[\/h1\]/gi, "## $1\n").replace(/\[h2\](.*?)\[\/h2\]/gi, "# $1\n").replace(/\[b\](.*?)\[\/b\]/gi, "**$1**").replace(/\[i\](.*?)\[\/i\]/gi, "*$1*").replace(/\[u\](.*?)\[\/u\]/gi, "$1").replace(/\[url=([^\]]+)\](.*?)\[\/url\]/g, "$2 ($1)").replace(/\[quote\](.*?)\[\/quote\]/gs, "> $1\n").replace(/\[\/?[a-z0-9=\-\*]*?\]/g, "").replace(/\n{3,}/g, "\n\n").replace(/\s+$/gm, "").trim();
}
__name(cleanBBCode, "cleanBBCode");
function processImagesInContent(content) {
  const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp))/gi;
  let result = content.replace(imgRegex, (imgUrl) => {
    return `
<img src="${imgUrl}"/>
`;
  });
  const steamImgRegex = /\{STEAM_CLAN_IMAGE\}([^"\s]+)/g;
  result = result.replace(steamImgRegex, (match, imgPath) => {
    const steamImgUrl = `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/${imgPath}`;
    return `
<img src="${steamImgUrl}"/>
`;
  });
  return result;
}
__name(processImagesInContent, "processImagesInContent");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  name
});
