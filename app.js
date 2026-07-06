// ===== 全局状态 =====
const State = {
    currentPage: 'home',
    apiConfig: {
        base: localStorage.getItem('api_base') || '',
        key: localStorage.getItem('api_key') || '',
        model: localStorage.getItem('api_model') || 'gpt-4o-mini'
    },
    works: JSON.parse(localStorage.getItem('works') || '[]'),
    currentSlide: 0
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    startBannerCarousel();
    loadApiConfig();
    renderWorks();
});

function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('statusTime').textContent = timeStr;
}

// ===== 导航系统 =====
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) {
        target.classList.add('active');
        target.scrollTop = 0;
        State.currentPage = pageId;
    }
    
    // 更新底部导航高亮
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (pageId === 'home') {
        document.querySelectorAll('.nav-item')[0]?.classList.add('active');
    } else if (pageId === 'my-works') {
        document.querySelectorAll('.nav-item')[1]?.classList.add('active');
    } else if (pageId === 'profile') {
        document.querySelectorAll('.nav-item')[2]?.classList.add('active');
    }
}

// ===== Banner轮播 =====
function startBannerCarousel() {
    setInterval(() => {
        goToSlide((State.currentSlide + 1) % 3);
    }, 4000);
}

function goToSlide(index) {
    State.currentSlide = index;
    document.querySelectorAll('.banner-slide').forEach((s, i) => {
        s.classList.toggle('active', i === index);
    });
    document.querySelectorAll('.dot').forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });
}

// ===== API配置 =====
function loadApiConfig() {
    document.getElementById('apiBase').value = State.apiConfig.base;
    document.getElementById('apiKey').value = State.apiConfig.key;
    document.getElementById('modelName').value = State.apiConfig.model;
}

function saveApiConfig() {
    const base = document.getElementById('apiBase').value.trim().replace(/\/$/, '');
    const key = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelName').value.trim() || 'gpt-4o-mini';
    
    State.apiConfig.base = base;
    State.apiConfig.key = key;
    State.apiConfig.model = model;
    
    localStorage.setItem('api_base', base);
    localStorage.setItem('api_key', key);
    localStorage.setItem('api_model', model);
    
    const status = document.getElementById('apiStatus');
    if (key && base) {
        status.textContent = '✅ API配置已保存';
        status.className = 'api-status success';
        showToast('API配置已保存，功能已启用');
    } else if (key) {
        status.textContent = '⚠️ 建议同时填写API地址';
        status.className = 'api-status success';
        showToast('API Key已保存');
    } else {
        status.textContent = '❌ 请填写API Key';
        status.className = 'api-status error';
    }
}

function getApiConfig() {
    return {
        base: State.apiConfig.base || 'https://api.openai.com',
        key: State.apiConfig.key,
        model: State.apiConfig.model
    };
}

function hasApiKey() {
    return !!(State.apiConfig.key && State.apiConfig.key.trim());
}

// ===== AI调用（OpenAI兼容API）=====
async function callAI(prompt, systemPrompt = '', maxTokens = 2000) {
    const config = getApiConfig();
    
    if (!config.key) {
        throw new Error('请先在"设置"页面配置OpenAI API Key');
    }
    
    const url = config.base.replace(/\/+$/, '') + '/chat/completions';
    
    const messages = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + config.key,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: config.model,
            messages: messages,
            max_tokens: maxTokens,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || 'API请求失败 (' + response.status + ')');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// ===== 加载状态 =====
function showLoading(text = '正在处理...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

// ===== Toast提示 =====
function showToast(message, duration = 2500) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== 复制功能 =====
function copyResult(elementId) {
    const el = document.getElementById(elementId);
    const text = el?.innerText || el?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ 已复制到剪贴板');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('✅ 已复制到剪贴板');
    });
}

// ===== 保存作品 =====
function saveWork(type, title, content) {
    const work = {
        id: Date.now(),
        type,
        title: title.substring(0, 30),
        preview: content.substring(0, 100),
        content,
        time: new Date().toLocaleString('zh-CN')
    };
    State.works.unshift(work);
    if (State.works.length > 50) State.works.pop();
    localStorage.setItem('works', JSON.stringify(State.works));
    renderWorks();
    showToast('💾 作品已保存');
}

function renderWorks() {
    const list = document.getElementById('worksList');
    if (State.works.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>暂无作品</p><small>使用上方功能创作你的第一个作品吧！</small></div>';
        return;
    }
    list.innerHTML = State.works.map(w => 
        <div class="work-item" onclick="viewWork()">
            <div class="work-item-header">
                <span class="work-item-type"> </span>
                <button class="copy-btn" onclick="event.stopPropagation();deleteWork()"><i class="fas fa-trash"></i></button>
            </div>
            <div class="work-item-title"></div>
            <div class="work-item-preview">...</div>
            <div class="work-item-time"></div>
        </div>
    ).join('');
}

function getTypeIcon(type) {
    const icons = { script: '🎬', copy: '✍️', image: '🖼️', audio: '🎵', analysis: '📊', download: '📥' };
    return icons[type] || '📄';
}

function viewWork(id) {
    const work = State.works.find(w => w.id === id);
    if (work) {
        alert('标题：' + work.title + '\\n\\n内容：\\n' + work.content);
    }
}

function deleteWork(id) {
    if (confirm('确定删除此作品？')) {
        State.works = State.works.filter(w => w.id !== id);
        localStorage.setItem('works', JSON.stringify(State.works));
        renderWorks();
        showToast('已删除');
    }
}

function switchWorksTab(el, filter) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    // Simple filter display
    const list = document.getElementById('worksList');
    const filtered = filter === 'all' ? State.works : State.works.filter(w => w.type === filter);
    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>该分类下暂无作品</p></div>';
    } else {
        // Re-render with filtered
        list.innerHTML = filtered.map(w => 
            <div class="work-item" onclick="viewWork()">
                <div class="work-item-header">
                    <span class="work-item-type"> </span>
                    <button class="copy-btn" onclick="event.stopPropagation();deleteWork()"><i class="fas fa-trash"></i></button>
                </div>
                <div class="work-item-title"></div>
                <div class="work-item-preview">...</div>
                <div class="work-item-time"></div>
            </div>
        ).join('');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function clearAllData() {
    if (confirm('确定清除所有数据？这将删除API配置和所有作品。')) {
        localStorage.clear();
        State.works = [];
        State.apiConfig = { base: '', key: '', model: 'gpt-4o-mini' };
        loadApiConfig();
        renderWorks();
        showToast('数据已清除');
    }
}

// ============================================
// ===== 功能实现 =====
// ============================================

// --- 1. 视频脚本生成 ---
async function generateScript() {
    const topic = document.getElementById('scriptTopic').value.trim();
    const type = document.getElementById('scriptType');
    const duration = document.getElementById('scriptDuration').value;
    
    if (!topic) return showToast('请输入视频主题');
    
    const typeText = type.options[type.selectedIndex].text;
    const durText = duration + '秒';
    
    showLoading('正在生成视频脚本...');
    
    try {
        const systemPrompt = 你是一位经验丰富的短视频脚本策划专家。擅长创作爆款视频脚本，节奏紧凑，开头有吸引力，结尾有引导。请用专业的分镜头格式输出脚本。;
        
        const prompt = 请为以下视频需求生成一份完整的拍摄脚本：

- 主题：
- 类型：
- 时长：

请按照以下格式输出：
1. 【视频标题】给出3个备选爆款标题
2. 【开场钩子】前3秒如何吸引观众
3. 【分镜头脚本】表格形式：画面描述 | 台词/字幕 | 时长 | BGM/音效
4. 【结尾引导】如何引导点赞关注
5. 【拍摄建议】景别、运镜、光线等
6. 【发布时间建议】最佳发布时间段;

        const result = await callAI(prompt, systemPrompt, 3000);
        document.getElementById('scriptContent').innerHTML = formatMarkdown(result);
        saveWork('script', topic + ' - ' + typeText, result);
    } catch (err) {
        document.getElementById('scriptContent').innerHTML = '<p style="color:red">❌ ' + escapeHtml(err.message) + '</p>';
    } finally {
        hideLoading();
    }
}

// --- 2. 文案生成 ---
async function generateCopy() {
    const product = document.getElementById('copyProduct').value.trim();
    const audience = document.getElementById('copyAudience').value.trim();
    const type = document.getElementById('copyType');
    
    if (!product) return showToast('请输入产品/服务介绍');
    
    showLoading('正在生成文案...');
    
    try {
        const typeText = type.options[type.selectedIndex].text;
        const systemPrompt = 你是一位资深文案策划专家，精通各平台文案风格，擅长用极具感染力的语言打动读者。;
        
        const prompt = 请为以下产品/服务创作：

- 产品/服务：
- 目标受众：

要求：
1. 给出5个不同角度的标题
2. 正文部分要有情感共鸣
3. 加入适当的emoji表情
4. 结尾有明确的行动号召
5. 适配的平台风格;

        const result = await callAI(prompt, systemPrompt, 2500);
        document.getElementById('copyContent').innerHTML = formatMarkdown(result);
        saveWork('copy', product.substring(0, 20) + ' - ' + typeText, result);
    } catch (err) {
        document.getElementById('copyContent').innerHTML = '<p style="color:red">❌ ' + escapeHtml(err.message) + '</p>';
    } finally {
        hideLoading();
    }
}

// --- 3. 文案二创 ---
async function rewriteCopy() {
    const original = document.getElementById('originalCopy').value.trim();
    if (!original) return showToast('请输入原始文案');
    
    const direction = document.getElementById('rewriteDirection');
    const directionText = direction.options[direction.selectedIndex].text;
    
    showLoading('正在改写文案...');
    
    try {
        const systemPrompt = 你是一位专业的文案编辑，擅长对已有内容进行二次创作，提升原创度同时保持核心信息不变。;
        
        const prompt = 请对以下文案进行二次创作：

【原始文案】


【改写方向】

要求：
1. 保持核心信息和观点不变
2. 大幅调整表达方式和句式结构
3. 提升原创度
4. 保持可读性和流畅性
5. 适当增加亮点和金句;

        const result = await callAI(prompt, systemPrompt, 2000);
        document.getElementById('rewriteContent').innerHTML = formatMarkdown(result);
        saveWork('copy', '二创 - ' + directionText, result);
    } catch (err) {
        document.getElementById('rewriteContent').innerHTML = '<p style="color:red">❌ ' + escapeHtml(err.message) + '</p>';
    } finally {
        hideLoading();
    }
}

// --- 4. 对标分析 ---
async function analyzeCompetitor() {
    const account = document.getElementById('accountName').value.trim();
    if (!account) return showToast('请输入账号名称或领域');
    
    showLoading('正在进行对标分析...');
    
    try {
        const systemPrompt = 你是一位自媒体数据分析专家，擅长竞品分析和账号诊断。请基于行业常识和专业经验进行分析。;
        
        const prompt = 请对以下自媒体账号/领域进行深度对标分析：

账号/领域：

请从以下维度分析：
1. 【账号定位】分析其目标受众和价值主张
2. 【内容策略】选题方向、内容形式、更新频率
3. 【爆款规律】什么类型的内容容易爆
4. 【变现模式】可能的盈利方式
5. 【优势劣势】SWOT分析
6. 【可借鉴点】我们可以学习什么
7. 【差异化建议】如何做出差异化竞争
8. 【增长策略】具体的运营建议;

        const result = await callAI(prompt, systemPrompt, 3000);
        const resultArea = document.getElementById('analysisResult');
        resultArea.innerHTML = '<div class="result-header"><span>分析报告</span><button class="copy-btn" onclick="copyResult(\'analysisContent\')"><i class="fas fa-copy"></i> 复制</button></div><div class="result-content" id="analysisContent">' + formatMarkdown(result) + '</div>';
        saveWork('analysis', account + ' - 对标分析', result);
    } catch (err) {
        document.getElementById('analysisResult').innerHTML = '<p style="color:red">❌ ' + escapeHtml(err.message) + '</p>';
    } finally {
        hideLoading();
    }
}

// --- 5. 文案提取 ---
async function extractCopy() {
    const topic = document.getElementById('extractTopic').value.trim();
    if (!topic) return showToast('请输入视频描述或话题');
    
    showLoading('正在提取文案...');
    
    try {
        const systemPrompt = 你是一位视频内容分析专家，擅长从视频描述中提取核心信息并整理成结构化文案。;
        
        const prompt = 根据以下视频描述/话题，生成一份完整的口播文案：

话题/描述：

请输出：
1. 【视频标题】3个备选
2. 【完整口播稿】约500-800字，口语化表达
3. 【关键信息点】3-5个核心要点
4. 【金句提炼】适合传播的金句
5. 【标签建议】5-10个相关话题标签;

        const result = await callAI(prompt, systemPrompt, 2000);
        document.getElementById('extractContent').innerHTML = formatMarkdown(result);
        saveWork('copy', '文案提取 - ' + topic, result);
    } catch (err) {
        document.getElementById('extractContent').innerHTML = '<p style="color:red">❌ ' + escapeHtml(err.message) + '</p>';
    } finally {
        hideLoading();
    }
}

// --- 6. 图文生成 ---
async function generateImageText() {
    const topic = document.getElementById('imageTextTopic').value.trim();
    if (!topic) return showToast('请输入主题');
    
    const platform = document.getElementById('targetPlatform');
    const platformText = platform.options[platform.selectedIndex].text;
    
    showLoading('正在生成图文笔记...');
    
    try {
        const systemPrompt = 你是一位小红书/微博等平台的内容创作者，擅长制作高互动率的图文笔记。;
        
        const prompt = 请为平台生成一篇图文笔记：

主题：

要求：
1. 【标题】吸引眼球的标题（带emoji）
2. 【正文】分段清晰，每段配图片描述
3. 【图片建议】每张图片的内容描述和构图建议
4. 【排版格式】适当使用emoji和分隔线
5. 【话题标签】10个相关话题
6. 【发布时间】建议发布时间
7. 【互动引导】如何在文中引导评论收藏;

        const result = await callAI(prompt, systemPrompt, 2000);
        const resultArea = document.getElementById('imageTextResult');
        resultArea.innerHTML = '<div class="result-header"><span>图文笔记</span><button class="copy-btn" onclick="copyResult(\'imageTextContent\')"><i class="fas fa-copy"></i> 复制</button></div><div class="result-content" id="imageTextContent">' + formatMarkdown(result) + '</div>';
        saveWork('copy', topic + ' - ' + platformText, result);
    } catch (err) {
        document.getElementById('imageTextResult').innerHTML = '<p style="color:red">❌ ' + escapeHtml(err.message) + '</p>';
    } finally {
        hideLoading();
    }
}

// --- 7. 资讯获取 ---
async function fetchNews() {
    const topic = document.getElementById('newsTopic').value.trim() || '科技AI';
    
    showLoading('正在获取最新资讯...');
    
    try {
        const systemPrompt = 你是一位资讯编辑，擅长搜集和整理热点资讯。请基于你的知识库提供相关信息。;
        
        const prompt = 请提供关于""的最新资讯和行业动态：

要求输出：
1. 【热点综述】最近的重要事件概述
2. 【头条新闻】5条最重要的新闻（标题+简述）
3. 【深度解读】对其中1-2条新闻的深度分析
4. 【影响评估】这些事件对相关领域的影响
5. 【趋势预测】未来可能的走向
6. 【信息来源参考】建议关注的媒体和账号

注意：由于我是AI助手，信息可能不是实时最新的，请基于你的训练数据提供尽可能准确的信息。;

        const result = await callAI(prompt, systemPrompt, 2500);
        const resultArea = document.getElementById('newsResult');
        resultArea.innerHTML = '<div class="result-header"><span>' + topic + ' 相关资讯</span><button class="copy-btn" onclick="copyResult(\'newsContent\')"><i class="fas fa-copy"></i> 复制</button></div><div class="result-content" id="newsContent">' + formatMarkdown(result) + '</div>';
        saveWork('copy', topic + ' - 资讯', result);
    } catch (err) {
        document.getElementById('newsResult').innerHTML = '<p style="color:red">❌ ' + escapeHtml(err.message) + '</p>';
    } finally {
        hideLoading();
    }
}

// --- 8. 智能图片（Pollinations.ai - 免费）---
async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value.trim();
    if (!prompt) return showToast('请输入图片描述');
    
    const style = document.getElementById('imageStyle').value;
    showLoading('正在生成图片...');
    
    try {
        // 使用Pollinations.ai免费API
        const englishPrompt = style + ' style illustration of ' + prompt;
        const imageUrl = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(englishPrompt) + '?width=1024&height=1024&nologo=true&seed=' + Math.floor(Math.random() * 99999);
        
        const img = document.getElementById('generatedImage');
        img.src = imageUrl;
        img.alt = prompt;
        
        const resultArea = document.getElementById('imageResult');
        resultArea.innerHTML = 
            <div class="image-preview">
                <img src="" alt="" style="max-width:100%;border-radius:12px;" onload="hideLoading()" onerror="hideLoading();document.getElementById('imageResult').innerHTML='<p style=color:red>图片加载失败</p>'">
                <p style="margin-top:12px;font-size:13px;color:#666;"> - </p>
                <button class="copy-btn" style="margin-top:10px;" onclick="window.open('','_blank')">
                    <i class="fas fa-external-link-alt"></i> 查看原图
                </button>
            </div>;
            
        saveWork('image', prompt.substring(0, 20) + ' - ' + style, imageUrl);
    } catch (err) {
        hideLoading();
        showToast('图片生成失败: ' + err.message);
    }
}

// --- 10. 视频下载 ---
function downloadVideo() {
    const url = document.getElementById('videoUrl').value.trim();
    if (!url) return showToast('请输入视频链接');
    
    showLoading('正在解析视频...');
    
    try {
        let downloadUrl = '';
        let platform = '未知平台';
        
        if (url.includes('douyin.com') || url.includes('iesdouyin.com')) {
            platform = '抖音';
            downloadUrl = 'https://www.douyin.com/waveless/app/share/reward/reward?shareUrl=' + encodeURIComponent(url);
        } else if (url.includes('kuaishou.com') || url.includes('kuaishou.cn')) {
            platform = '快手';
            downloadUrl = 'https://www.kuaishou.com/fetch?url=' + encodeURIComponent(url);
        } else if (url.includes('xiaohongshu.com')) {
            platform = '小红书';
            downloadUrl = 'https://www.xiaohongshu.com/share?url=' + encodeURIComponent(url);
        } else if (url.includes('weibo.com')) {
            platform = '微博';
            downloadUrl = 'https://weibo.com/tv/api/component?url=' + encodeURIComponent(url);
        }
        
        // 由于浏览器CORS限制，无法直接下载
        // 我们提供一个解决方案
        hideLoading();
        
        const resultArea = document.getElementById('videoResult');
        resultArea.innerHTML = 
            <div style="text-align:center;padding:20px;">
                <i class="fas fa-video" style="font-size:48px;color:#6C5CE7;margin-bottom:16px;"></i>
                <h4 style="margin-bottom:8px;">视频解析</h4>
                <p style="color:#666;font-size:13px;margin-bottom:16px;">检测到视频链接</p>
                <div style="background:#F5F6FA;padding:12px;border-radius:10px;margin-bottom:16px;text-align:left;">
                    <p style="font-size:12px;color:#999;margin-bottom:8px;">💡 由于浏览器限制，请按以下步骤操作：</p>
                    <ol style="font-size:13px;color:#666;padding-left:20px;line-height:1.8;">
                        <li>复制链接到剪贴板</li>
                        <li>使用第三方解析工具</li>
                        <li>或在电脑浏览器中打开</li>
                    </ol>
                </div>
                <button class="copy-btn" onclick="navigator.clipboard.writeText('').then(()=>showToast('链接已复制'))">
                    <i class="fas fa-copy"></i> 复制链接
                </button>
                <br><br>
                <a href="https://savevideo.me" target="_blank" style="color:#6C5CE7;font-size:13px;">
                    <i class="fas fa-external-link-alt"></i> 使用在线工具解析
                </a>
            </div>;
            
        showToast('已识别' + platform + '视频');
    } catch (err) {
        hideLoading();
        showToast('解析失败');
    }
}

// --- 11. 数字人 ---
async function generateDigitalHuman() {
    const text = document.getElementById('digitalHumanText').value.trim();
    if (!text) return showToast('请输入播报文案');
    
    showLoading('正在生成数字人视频...');
    
    try {
        // 数字人视频需要专业API，我们提供文案+音频方案
        // 先生成音频
        const voice = 'zh-CN-YunxiNeural';
        const encodedText = encodeURIComponent(text.substring(0, 200));
        const googleTtsUrl = https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=&tl=zh-CN;
        
        // 获取音频
        const response = await fetch(googleTtsUrl);
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        
        hideLoading();
        
        const resultArea = document.getElementById('digitalHumanResult');
        resultArea.innerHTML = 
            <div style="text-align:center;padding:20px;">
                <i class="fas fa-robot" style="font-size:48px;color:#6C5CE7;margin-bottom:16px;"></i>
                <h4 style="margin-bottom:8px;">数字人播报准备</h4>
                <p style="color:#666;font-size:13px;margin-bottom:16px;">已生成播报音频，可使用数字人视频工具合成</p>
                <audio controls autoplay style="width:100%;margin-bottom:16px;">
                    <source src="" type="audio/mpeg">
                </audio>
                <br>
                <button class="copy-btn" onclick="window.open('','_blank')">
                    <i class="fas fa-download"></i> 下载音频
                </button>
                <br><br>
                <div style="background:#F5F6FA;padding:12px;border-radius:10px;text-align:left;">
                    <p style="font-size:12px;color:#999;margin-bottom:8px;">🎬 下一步：使用数字人工具</p>
                    <ul style="font-size:13px;color:#666;padding-left:20px;line-height:1.8;">
                        <li>HeyGen: heysgen.com</li>
                        <li>D-ID: d-id.com</li>
                        <li>腾讯智影: zhiying.qq.com</li>
                    </ul>
                </div>
            </div>;
            
        saveWork('audio', '数字人播报 - ' + text.substring(0, 20), audioUrl);
        showToast('✅ 音频已生成');
    } catch (err) {
        hideLoading();
        showToast('生成失败: ' + err.message);
    }
}

// --- Markdown简易格式化 ---
function formatMarkdown(text) {
    if (!text) return '';
    return text
        // 标题
        .replace(/^### (.+)$/gm, '<h4 style="color:#6C5CE7;margin:12px 0 6px;"></h4>')
        .replace(/^## (.+)$/gm, '<h3 style="color:#6C5CE7;margin:14px 0 8px;"></h3>')
        .replace(/^# (.+)$/gm, '<h2 style="color:#6C5CE7;margin:16px 0 10px;"></h2>')
        // 粗体
        .replace(/\*\*(.+?)\*\*/g, '<strong></strong>')
        // 斜体
        .replace(/\*(.+?)\*/g, '<em></em>')
        // 代码块
        .replace(/`([\s\S]*?)`/g, '<pre style="background:#F5F6FA;padding:12px;border-radius:8px;overflow-x:auto;font-size:12px;"></pre>')
        // 行内代码
        .replace(/(.+?)/g, '<code style="background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:12px;"></code>')
        // 分割线
        .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #eee;margin:16px 0;">')
        // 有序列表
        .replace(/^\d+\.\s+(.+)$/gm, '<div style="padding-left:20px;position:relative;"><span style="position:absolute;left:0;color:#6C5CE7;font-weight:600;">$&nbsp;</span></div>')
        // 无序列表
        .replace(/^[-*]\s+(.+)$/gm, '<div style="padding-left:20px;">• </div>')
        // 换行
        .replace(/\n/g, '<br>');
}
﻿async function generateAudio() {
    const text = document.getElementById('ttsText').value.trim();
    if (!text) return showToast('请输入要转换的文字');
    const voice = document.getElementById('ttsVoice').value;
    const speed = document.getElementById('ttsSpeed').value;
    const voiceLabel = document.getElementById('ttsVoice').options[document.getElementById('ttsVoice').selectedIndex].text;
    showLoading('正在生成音频...');
    try {
        const speedPercent = (parseFloat(speed) * 100).toFixed(0);
        const safeText = encodeURIComponent(text.substring(0, 500));
        const ttsMakerUrl = 'https://ttsmaker.com/zh-CN/?text=' + safeText + '&speed=' + speedPercent;
        hideLoading();
        const ra = document.getElementById('audioResult');
        ra.innerHTML = '<div style="text-align:center;padding:20px;">' +
            '<i class="fas fa-microphone" style="font-size:48px;color:#6C5CE7;margin-bottom:16px;"></i>' +
            '<p style="margin-bottom:12px;color:#333;font-size:15px;font-weight:600;">🎙️ 文案已准备好</p>' +
            '<div style="background:#F5F6FA;padding:16px;border-radius:12px;margin-bottom:16px;text-align:left;">' +
            '<p style="font-size:12px;color:#999;margin-bottom:8px;">📝 播报内容：</p>' +
            '<p style="font-size:14px;color:#333;line-height:1.6;">"' + escapeHtml(text.substring(0, 100)) + '"</p>' +
            '<p style="font-size:12px;color:#999;margin-top:8px;">🎤 声音：' + escapeHtml(voiceLabel) + '</p>' +
            '<p style="font-size:12px;color:#999;">⏱️ 语速：' + speed + 'x</p>' +
            '</div>' +
            '<button class="action-btn" style="margin-bottom:10px;padding:12px;" onclick="window.open(\'' + ttsMakerUrl + '\',\'_blank\')">' +
            '<i class="fas fa-external-link-alt"></i> 在 TTSMaker 生成音频（免费）</button>' +
            '<br><button class="copy-btn" onclick="navigator.clipboard.writeText(\'' + safeText.replace(/'/g, "\\'") + '\').then(()=>showToast(\'✅已复制\'))">' +
            '<i class="fas fa-copy"></i> 复制文案</button>' +
            '<br><br><p style="font-size:11px;color:#bbb;">💡 TTSMaker 是完全免费的在线TTS工具，支持多种中文声音，无需注册</p>' +
            '</div>';
        showToast('✅ 已准备好音频参数');
    } catch (err) {
        hideLoading();
        showToast('生成失败: ' + err.message);
    }
}
function downloadAudio(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audio_' + Date.now() + '.mp3';
    a.click();
}

