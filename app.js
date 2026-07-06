// ===== 全局状态 =====
const State = {
    currentPage: 'home',
    apiConfig: {
        base: localStorage.getItem('api_base') || '',
        key: localStorage.getItem('api_key') || '',
        model: localStorage.getItem('api_model') || 'gpt-4o-mini'
    },
    works: JSON.parse(localStorage.getItem('works') || '[]')
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 60000);
    loadApiConfig();
});

function updateTime() {
    const now = new Date();
    document.querySelector('.status-bar .time').textContent =
        now.toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'});
}

// ===== 导航 =====
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
        State.currentPage = pageId;
    }
    // 更新底部导航
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.page === pageId);
    });
    // 首页隐藏底部导航
    const nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = pageId === 'home' ? 'flex' : 'none';
}

// ===== API配置 =====
function loadApiConfig() {
    document.getElementById('apiBase').value = State.apiConfig.base;
    document.getElementById('apiKey').value = State.apiConfig.key;
    document.getElementById('modelName').value = State.apiConfig.model;
}

function saveApiConfig() {
    const base = document.getElementById('apiBase').value.trim().replace(/\/+$/, '');
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
        showToast('API配置已保存');
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

// ===== AI调用 =====
async function callAI(prompt, systemPrompt = '', maxTokens = 2000) {
    const config = getApiConfig();
    if (!config.key) throw new Error('请先在"设置"页面配置OpenAI API Key');
    const url = config.base.replace(/\/+$/, '') + '/chat/completions';
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + config.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, messages, max_tokens: maxTokens, temperature: 0.7 })
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || 'API请求失败 (' + response.status + ')');
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

// ===== 工具函数 =====
function showLoading(text) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('show');
}
function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}
function showToast(msg, dur) {
    dur = dur || 2500;
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, dur);
}
function copyText(elId) {
    var el = document.getElementById(elId);
    if (el) {
        navigator.clipboard.writeText(el.innerText).then(function() { showToast('✅ 已复制'); });
    }
}
function formatMd(text) {
    return text
        .replace(/^### (.+)$/gm, '<h4 style="color:#6C5CE7;margin:12px 0 6px;"></h4>')
        .replace(/^## (.+)$/gm, '<h3 style="color:#6C5CE7;margin:14px 0 8px;"></h3>')
        .replace(/^# (.+)$/gm, '<h2 style="color:#6C5CE7;margin:16px 0 10px;"></h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong></strong>')
        .replace(/\n/g, '<br>');
}

// ===== 功能1: 文案提取 =====
async function extractCopy() {
    var topic = document.getElementById('extractTopic').value.trim();
    if (!topic) return showToast('请输入视频描述或话题');
    showLoading('正在提取文案...');
    try {
        var result = await callAI(
            '根据话题"' + topic + '"生成一份完整的口播文案，包含标题、口播稿、关键信息点、金句和标签建议。',
            '你是一位视频内容分析专家，擅长整理结构化文案。', 2000
        );
        document.getElementById('extractContent').innerHTML = formatMd(result);
        document.getElementById('extractResult').style.display = 'block';
    } catch(e) {
        document.getElementById('extractContent').innerHTML = '<p style="color:red">❌ ' + e.message + '</p>';
        document.getElementById('extractResult').style.display = 'block';
    } finally { hideLoading(); }
}

// ===== 功能2: 对标分析 =====
async function analyzeCompetitor() {
    var account = document.getElementById('accountName').value.trim();
    if (!account) return showToast('请输入账号名称');
    showLoading('正在分析...');
    try {
        var result = await callAI(
            '请对账号"' + account + '"进行深度对标分析，包括：账号定位、内容策略、爆款规律、SWOT分析、差异化建议。',
            '你是一位自媒体数据分析专家。', 2500
        );
        document.getElementById('analysisContent').innerHTML = formatMd(result);
        document.getElementById('analysisResult').style.display = 'block';
    } catch(e) {
        document.getElementById('analysisContent').innerHTML = '<p style="color:red">❌ ' + e.message + '</p>';
        document.getElementById('analysisResult').style.display = 'block';
    } finally { hideLoading(); }
}

// ===== 功能3: 文案贰创 =====
async function rewriteCopy() {
    var original = document.getElementById('originalCopy').value.trim();
    if (!original) return showToast('请输入原始文案');
    var dir = document.getElementById('rewriteDirection');
    var dirText = dir.options[dir.selectedIndex].text;
    showLoading('正在改写...');
    try {
        var result = await callAI(
            '请对以下文案进行二次创作，方向是"' + dirText + '":\\n\\n' + original,
            '你是一位专业的文案编辑，擅长提升原创度。', 2000
        );
        document.getElementById('rewriteContent').innerHTML = formatMd(result);
        document.getElementById('rewriteResult').style.display = 'block';
    } catch(e) {
        document.getElementById('rewriteContent').innerHTML = '<p style="color:red">❌ ' + e.message + '</p>';
        document.getElementById('rewriteResult').style.display = 'block';
    } finally { hideLoading(); }
}

// ===== 功能4: 智能生图（免费Pollinations.ai） =====
async function generateImage() {
    var prompt = document.getElementById('imagePrompt').value.trim();
    if (!prompt) return showToast('请输入图片描述');
    var style = document.getElementById('imageStyle');
    var styleText = style.options[style.selectedIndex].text;
    showLoading('正在生成图片...');
    try {
        var seed = Math.floor(Math.random() * 99999);
        var url = 'https://image.pollinations.ai/prompt/' +
            encodeURIComponent(styleText + ' illustration of ' + prompt) +
            '?width=1024&height=1024&nologo=true&seed=' + seed;
        document.getElementById('generatedImage').src = url;
        document.getElementById('imageResult').style.display = 'block';
        document.getElementById('imageResult').innerHTML =
            '<div class="image-preview"><img src="' + url + '" alt="' + prompt + '" onload="hideLoading()" onerror="hideLoading();showToast(\'图片加载失败\')"><p style="margin-top:12px;font-size:13px;color:#666;">' + prompt + ' - ' + styleText + '</p></div>';
    } catch(e) { hideLoading(); showToast('生成失败'); }
}

// ===== 功能5: 图文海报 =====
async function generateImageText() {
    var topic = document.getElementById('imageTextTopic').value.trim();
    if (!topic) return showToast('请输入主题');
    var plat = document.getElementById('targetPlatform');
    var platText = plat.options[plat.selectedIndex].text;
    showLoading('正在生成...');
    try {
        var result = await callAI(
            '请为' + platText + '平台生成一篇图文笔记，主题是"' + topic + '"。包含标题、正文（分段+emoji）、图片建议、话题标签。',
            '你是一位' + platText + '平台的内容创作者。', 2000
        );
        document.getElementById('imageTextContent').innerHTML = formatMd(result);
        document.getElementById('imageTextResult').style.display = 'block';
    } catch(e) {
        document.getElementById('imageTextContent').innerHTML = '<p style="color:red">❌ ' + e.message + '</p>';
        document.getElementById('imageTextResult').style.display = 'block';
    } finally { hideLoading(); }
}

// ===== 功能6: 视频下载 =====
function downloadVideo() {
    var url = document.getElementById('videoUrl').value.trim();
    if (!url) return showToast('请输入视频链接');
    showLoading('正在解析...');
    setTimeout(function() {
        hideLoading();
        var resultDiv = document.getElementById('videoResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div style="text-align:center;padding:20px;">' +
            '<i class="fas fa-video" style="font-size:48px;color:#6C5CE7;margin-bottom:16px;"></i>' +
            '<p style="color:#666;font-size:14px;margin-bottom:12px;">请使用在线工具解析视频</p>' +
            '<a href="https://savevideo.me" target="_blank" style="color:#6C5CE7;font-size:14px;">' +
            '<i class="fas fa-external-link-alt"></i> 前往 savevideo.me 解析</a>' +
            '<br><br><button class="copy-btn" onclick="navigator.clipboard.writeText(\'' + url.replace(/'/g, "\\\\'") + '\').then(()=>showToast(\'链接已复制\'))">' +
            '<i class="fas fa-copy"></i> 复制链接</button></div>';
    }, 1000);
}

// ===== 功能7: 智能配音（免费TTSMaker） =====
function generateAudio() {
    var text = document.getElementById('ttsText').value.trim();
    if (!text) return showToast('请输入要转换的文字');
    var voice = document.getElementById('ttsVoice');
    var voiceLabel = voice.options[voice.selectedIndex].text;
    var speed = document.getElementById('ttsSpeed').value;
    var speedPercent = (parseFloat(speed) * 100).toFixed(0);
    var safeText = encodeURIComponent(text.substring(0, 500));
    var ttsUrl = 'https://ttsmaker.com/zh-CN/?text=' + safeText + '&speed=' + speedPercent;
    document.getElementById('audioResult').style.display = 'block';
    document.getElementById('audioResult').innerHTML =
        '<div style="text-align:center;padding:20px;">' +
        '<i class="fas fa-microphone" style="font-size:48px;color:#6C5CE7;margin-bottom:16px;"></i>' +
        '<p style="margin-bottom:12px;color:#333;font-size:15px;font-weight:600;">🎙️ 配音已准备</p>' +
        '<div style="background:#F5F6FA;padding:16px;border-radius:12px;margin-bottom:16px;text-align:left;">' +
        '<p style="font-size:12px;color:#999;margin-bottom:8px;">📝 内容：</p>' +
        '<p style="font-size:14px;color:#333;line-height:1.6;">"' + text.substring(0, 100) + '"</p>' +
        '<p style="font-size:12px;color:#999;margin-top:8px;">🎤 声音：' + voiceLabel + '</p>' +
        '<p style="font-size:12px;color:#999;">⏱️ 语速：' + speed + 'x</p></div>' +
        '<button class="primary-btn" style="margin-bottom:10px;" onclick="window.open(\'' + ttsUrl + '\',\'_blank\')">' +
        '<i class="fas fa-external-link-alt"></i> 在 TTSMaker 生成音频（免费）</button>' +
        '<button class="copy-btn" onclick="navigator.clipboard.writeText(\'' + safeText.replace(/'/g, "\\\\'") + '\').then(()=>showToast(\'已复制\'))">' +
        '<i class="fas fa-copy"></i> 复制文案</button>' +
        '<br><p style="font-size:11px;color:#bbb;margin-top:12px;">💡 TTSMaker 是完全免费的在线TTS工具</p></div>';
    showToast('✅ 已准备好配音参数');
}

// ===== 功能8: 数字人 =====
function generateDigitalHuman() {
    var text = document.getElementById('digitalHumanText').value.trim();
    if (!text) return showToast('请输入播报文案');
    document.getElementById('digitalHumanResult').style.display = 'block';
    document.getElementById('digitalHumanResult').innerHTML =
        '<div style="text-align:center;padding:20px;">' +
        '<i class="fas fa-robot" style="font-size:48px;color:#6C5CE7;margin-bottom:16px;"></i>' +
        '<p style="margin-bottom:12px;color:#333;font-size:15px;font-weight:600;">🤖 数字人播报</p>' +
        '<div style="background:#F5F6FA;padding:16px;border-radius:12px;margin-bottom:16px;text-align:left;">' +
        '<p style="font-size:12px;color:#999;margin-bottom:8px;">📝 播报内容：</p>' +
        '<p style="font-size:14px;color:#333;line-height:1.6;">"' + text.substring(0, 100) + '"</p></div>' +
        '<p style="font-size:13px;color:#666;margin-bottom:12px;">数字人视频需接入专业API服务</p>' +
        '<button class="primary-btn" onclick="generateAudio();document.getElementById(\'digitalHumanText\').value=document.getElementById(\'ttsText\').value;">' +
        '<i class="fas fa-headphones"></i> 先生成配音</button></div>';
}
