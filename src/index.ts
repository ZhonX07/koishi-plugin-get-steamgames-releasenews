import { Context, Schema, h } from 'koishi'

export const name = 'get-steamgames-releasenews'

export interface Config {
  maxLength?: number
  count?: number
}

export const Config: Schema<Config> = Schema.object({
  maxLength: Schema.number().description('返回的内容的最大长度。如果为 0，返回完整内容。').default(0),
  count: Schema.number().description('要获取的文章数量').default(5)
})

export function apply(ctx: Context, config: Config) {
  ctx.command('steam-games-update-news <gamecode:string>', '获取steam游戏更新新闻')
    .option('count', '-c <count:number> 要获取的文章数量', { fallback: config.count })
    .option('length', '-l <length:number> 返回的内容的最大长度', { fallback: config.maxLength })
    .action(async ({ session, options }, gamecode) => {
      if (!gamecode) {
        return '请提供游戏代码 (AppID)'
      }
      
      try {
        // 构建请求参数
        const params = {
          appid: gamecode,
          count: options.count,
          maxlength: options.length,
        }
        
        // 发送请求到Steam API
        const response = await ctx.http.get('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/', { params })
        
        // 处理响应
        const { appnews } = response
        if (!appnews || !appnews.newsitems || !appnews.newsitems.length) {
          return '未找到该游戏的新闻'
        }
        
        // 格式化输出
        let result = `《${appnews.appname || `AppID: ${gamecode}`}的最新更新》\n${'='.repeat(30)}\n\n`
        
        for (let i = 0; i < appnews.newsitems.length; i++) {
          const news = appnews.newsitems[i]
          // 添加序号和醒目的标题
          result += `【${i + 1}】${news.title}\n`
          
          // 格式化日期
          const newsDate = new Date(news.date * 1000)
          const formattedDate = `${newsDate.getFullYear()}年${newsDate.getMonth() + 1}月${newsDate.getDate()}日 ${newsDate.getHours()}:${newsDate.getMinutes().toString().padStart(2, '0')}`
          result += `📅 ${formattedDate}\n\n`
          
          // 清理内容中的BBCode标签
          const cleanContent = cleanBBCode(news.contents)
          
          // 检测并处理内容中的图片链接
          const processedContent = processImagesInContent(cleanContent)
          
          result += `${processedContent}\n`
          
          // 添加链接和分隔线
          result += `🔗 ${news.url}\n`
          
          // 如果不是最后一条新闻，添加分隔线
          if (i < appnews.newsitems.length - 1) {
            result += `\n${'-'.repeat(30)}\n\n`
          }
        }
        
        // 一次性发送所有内容
        await session.send(result.trim())
      } catch (error) {
        console.error('获取Steam游戏新闻失败:', error)
        return `获取游戏新闻失败: ${error.message || '未知错误'}`
      }
    })
}

/**
 * 清除BBCode标签
 */
function cleanBBCode(text: string): string {
  if (!text) return '';
  
  // 移除所有BBCode标签并进行格式优化
  return text
    // 处理列表
    .replace(/\[\/?list\]/g, '\n')
    .replace(/\[\*\]/g, '• ')
    // 处理标题和强调
    .replace(/\[h1\](.*?)\[\/h1\]/gi, '## $1\n')
    .replace(/\[h2\](.*?)\[\/h2\]/gi, '# $1\n')
    .replace(/\[b\](.*?)\[\/b\]/gi, '**$1**')
    .replace(/\[i\](.*?)\[\/i\]/gi, '*$1*')
    .replace(/\[u\](.*?)\[\/u\]/gi, '$1')
    // 处理链接
    .replace(/\[url=([^\]]+)\](.*?)\[\/url\]/g, '$2 ($1)')
    // 处理引用
    .replace(/\[quote\](.*?)\[\/quote\]/gs, '> $1\n')
    // 移除其他所有BBCode标签
    .replace(/\[\/?[a-z0-9=\-\*]*?\]/g, '')
    // 清理多余空行和空格
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+$/gm, '')
    .trim();
}

/**
 * 处理内容中的图片，转换为Koishi可识别的格式
 */
function processImagesInContent(content: string): string {
  // 识别可能的图片URL格式
  const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp))/gi;
  
  // 替换图片链接为可显示的图片
  let result = content.replace(imgRegex, (imgUrl) => {
    // 返回Koishi格式的图片元素并添加换行
    return `\n<img src="${imgUrl}"/>\n`;
  });
  
  // 替换Steam特定的图片链接格式
  const steamImgRegex = /\{STEAM_CLAN_IMAGE\}([^"\s]+)/g;
  result = result.replace(steamImgRegex, (match, imgPath) => {
    const steamImgUrl = `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/${imgPath}`;
    return `\n<img src="${steamImgUrl}"/>\n`;
  });
  
  return result;
}
