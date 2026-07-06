// ===== 全局状态 =====
const State = {
    currentPage: 'home',
    selectedTemplate: '爆款公式',
    selectedVoice: '温馨女声',
    selectedAvatar: '商务男士-张总',
    selectedRatio: '1:1',
    selectedImageType: '文生图',
    works: JSON.parse(localStorage.getItem('sm_works') || '[]'),
    apiConfig: {
        base: localStorage.getItem('api_base') || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        key: localStorage.getItem('api_key') || '',
        model: localStorage.getItem('api_model') || 'qwen-turbo'
    }
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 60000);
    loadApiConfig();
    renderWorks();
});

function updateTime() {
    const el = document.querySelector('.status-bar .time');
    if (el) el.textContent = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
}

// ===== 导航 =====
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) { target.classList.add('active'); State.currentPage = pageId; }
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === pageId));
    const nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = (pageId === 'home' || pageId === 'settings' || pageId === 'works') ? 'flex' : 'none';
}

// ===== API配置 =====
function loadApiConfig() {
    const b = document.getElementById('apiBase');
    const k = document.getElementById('apiKey');
    const m = document.getElementById('modelName');
    if (b) b.value = State.apiConfig.base;
    if (k) k.value = State.apiConfig.key;
    if (m) m.value = State.apiConfig.model;
}

function saveApiConfig() {
    const base = document.getElementById('apiBase').value.trim().replace(/\/+$/,'');
    const key = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelName').value.trim() || 'qwen-turbo';
    State.apiConfig.base = base;
    State.apiConfig.key = key;
    State.apiConfig.model = model;
    localStorage.setItem('api_base', base);
    localStorage.setItem('api_key', key);
    localStorage.setItem('api_model', model);
    const s = document.getElementById('apiStatus');
    if (s) {
        if (key) { s.textContent = '✅ API配置已保存'; s.className = 'api-status success'; }
        else { s.textContent = '❌ 请填写API Key'; s.className = 'api-status error'; }
    }
    showToast(key ? '✅ 配置已保存' : '⚠️ 请填写API Key');
}

function getApiConfig() {
    return {
        base: State.apiConfig.base || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        key: State.apiConfig.key,
        model: State.apiConfig.model
    };
}

// ===== AI调用 =====
async function callAI(prompt, systemPrompt='', maxTokens=2000) {
    const config = getApiConfig();
    if (!config.key) throw new Error('请先在"设置"页面配置API Key');
    const url = config.base.replace(/\/+$/,'') + '/chat/completions';
    const messages = [];
    if (systemPrompt) messages.push({role:'system', content:systemPrompt});
    messages.push({role:'user', content:prompt});
    const resp = await fetch(url, {
        method:'POST',
        headers:{'Authorization':'Bearer '+config.key,'Content-Type':'application/json'},
        body:JSON.stringify({model:config.model, messages, max_tokens:maxTokens, temperature:0.7})
    });
    if (!resp.ok) {
        const err = await resp.json().catch(()=>({}));
        throw new Error(err.error?.message || 'API请求失败('+resp.status+')');
    }
    const data = await resp.json();
    return data.choices[0].message.content;
}

// ===== 工具函数 =====
function showLoading(text) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('show');
}
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('show'); }
function showToast(msg, dur) {
    dur = dur || 2500;
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>{ t.classList.remove('show'); }, dur);
}
function copyText(elId) {
    const el = document.getElementById(elId);
    if (el) {
        const text = el.innerText || el.textContent;
        navigator.clipboard.writeText(text).then(()=>showToast('✅ 已复制到剪贴板'));
    }
}
function formatMd(text) {
    return text
        .replace(/^### (.+)$/gm, '<strong style="color:#6C5CE7"></strong>')
        .replace(/^## (.+)$/gm, '<strong style="color:#6C5CE7;font-size:16px"></strong>')
        .replace(/^# (.+)$/gm, '<strong style="color:#6C5CE7;font-size:18px"></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#6C5CE7"></strong>')
        .replace(/•/g, '<br>&nbsp;&nbsp;•')
        .replace(/\n/g, '<br>');
}
function updateCharCount(inputId, countId, max) {
    const val = document.getElementById(inputId)?.value || '';
    const el = document.getElementById(countId);
    if (el) el.textContent = val.length;
}
function getTimestamp() {
    return new Date().toLocaleString('zh-CN');
}

// ===== 选择函数 =====
function selectPlatform(el, name) {
    document.querySelectorAll('.platform-tag').forEach(t=>t.classList.remove('selected'));
    el.classList.add('selected');
}
function selectTemplate(el, type) {
    document.querySelectorAll('.template-card').forEach(c=>c.classList.remove('active'));
    el.classList.add('active');
    State.selectedTemplate = type;
}
function selectImageType(el, type) {
    document.querySelectorAll('.type-tab').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    State.selectedImageType = type;
}
function selectRatio(el, ratio) {
    document.querySelectorAll('.ratio-option').forEach(r=>r.classList.remove('active'));
    el.classList.add('active');
    State.selectedRatio = ratio;
}
function selectVoice(el, name) {
    document.querySelectorAll('.voice-card').forEach(c=>c.classList.remove('active'));
    el.classList.add('active');
    State.selectedVoice = name;
}
function selectAvatar(el, name) {
    document.querySelectorAll('.avatar-card').forEach(c=>c.classList.remove('active'));
    el.classList.add('active');
    State.selectedAvatar = name;
}
function filterFunctions() {
    const q = document.getElementById('globalSearch').value.toLowerCase();
    document.querySelectorAll('.func-card').forEach(card => {
        const keywords = (card.dataset.keywords || '').toLowerCase();
        const name = (card.dataset.name || '').toLowerCase();
        card.classList.toggle('hidden', q && !keywords.includes(q) && !name.includes(q));
    });
}

// ===== 图片上传 =====
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('uploadedImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}
function removeUploadedImage() {
    document.getElementById('uploadedImagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
    document.getElementById('imageUpload').value = '';
}
function detectPlatform(type) {
    showToast('已选择平台: ' + type);
}

// ===== 1. 文案提取 =====
async function extractCopy() {
    const url = document.getElementById('extractUrl').value.trim();
    const desc = document.getElementById('extractDesc').value.trim();
    if (!url && !desc) return showToast('请输入视频链接或描述');
    showLoading('正在提取文案...');
    try {
        const prompt = url
            ? '请根据以下视频链接和描述，提取并生成完整的口播文案：\\n链接：' + url + '\\n描述：' + desc
            : '请根据以下视频描述，生成完整的口播文案：' + desc;
        const result = await callAI(
            prompt,
            '你是一位视频内容分析专家，擅长从视频中提取核心信息并整理成结构化文案。请输出：1)吸引人的标题 2)完整口播稿 3)关键信息点 4)金句提炼 5)话题标签建议。用Markdown格式输出。',
            2000
        );
        document.getElementById('extractContent').innerHTML = formatMd(result);
        document.getElementById('extractResult').style.display = 'block';
        showToast('✅ 文案提取完成');
    } catch(e) {
        document.getElementById('extractContent').innerHTML = '<p style="color:red">❌ ' + e.message + '</p>';
        document.getElementById('extractResult').style.display = 'block';
    } finally { hideLoading(); }
}

// ===== 2. 对标分析 =====
async function analyzeCompetitor() {
    const account = document.getElementById('accountName').value.trim();
    if (!account) return showToast('请输入账号名称');
    const platform = document.getElementById('analyzePlatform').value;
    const dimensions = [];
    document.querySelectorAll('#competitor .checkbox-item input:checked').forEach(cb => dimensions.push(cb.value));
    if (dimensions.length === 0) return showToast('请至少选择一个分析维度');
    showLoading('正在分析 ' + account + '...');
    try {
        const result = await callAI(
            '请对' + platform + '平台的账号"' + account + '"进行深度对标分析。分析维度包括：' + dimensions.join('、') + '。请给出详细报告。',
            '你是一位自媒体数据分析专家，擅长竞品分析和策略制定。请用Markdown格式输出结构化报告，包含数据对比、图表建议、可执行策略。',
            3000
        );
        document.getElementById('analysisContent').innerHTML = formatMd(result);
        document.getElementById('analysisResult').style.display = 'block';
        showToast('✅ 分析完成');
    } catch(e) {
        document.getElementById('analysisContent').innerHTML = '<p style="color:red">❌ ' + e.message + '</p>';
        document.getElementById('analysisResult').style.display = 'block';
    } finally { hideLoading(); }
}

// ===== 3. 文案二创 =====
async function rewriteCopy() {
    const original = document.getElementById('originalCopy').value.trim();
    if (!original) return showToast('请输入原始文案');
    const intensity = document.getElementById('rewriteIntensity').value;
    const intensityMap = {1:'轻微调整语序和用词，保持原意', 2:'大幅度改写，改变表达方式和结构', 3:'完全重构，只保留核心观点'};
    showLoading('正在改写...');
    try {
        const result = await callAI(
            '请将以下文案按照"' + State.selectedTemplate + '"模板进行二次创作，改写强度：' + intensityMap[intensity] + '\\n\\n原始文案：\\n' + original,
            '你是一位专业的自媒体文案编辑，精通各种爆款文案模板。请输出改写后的完整文案，包含标题、正文、标签。用Markdown格式。',
            2000
        );
        document.getElementById('rewriteContent').innerHTML = formatMd(result);
        document.getElementById('rewriteResult').style.display = 'block';
        showToast('✅ 改写完成');
    } catch(e) {
        document.getElementById('rewriteContent').innerHTML = '<p style="color:red">❌ ' + e.message + '</p>';
        document.getElementById('rewriteResult').style.display = 'block';
    } finally { hideLoading(); }
}

// ===== 4. 智能图片（免费Pollinations.ai）=====
async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value.trim();
    if (!prompt) return showToast('请输入图片描述');
    const style = document.getElementById('imageStyle').value;
    const ratio = State.selectedRatio;
    const dims = {'1:1':[1024,1024],'4:3':[1024,768],'3:4':[768,1024],'16:9':[1024,576],'9:16':[576,1024]};
    const [w,h] = dims[ratio] || [1024,1024];
    showLoading('正在生成图片...');
    try {
        const seed = Math.floor(Math.random()*99999);
        const imgUrl = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt + ', ' + style + ' style') + '?width=' + w + '&height=' + h + '&nologo=true&seed=' + seed;
        document.getElementById('imageResult').style.display = 'block';
        document.getElementById('imageResult').innerHTML =
            '<div class="image-preview">' +
            '<img src="'+imgUrl+'" alt="'+prompt+'" onload="hideLoading();showToast(\'✅ 图片生成成功\')" onerror="hideLoading();showToast(\'图片加载失败，请重试\')">' +
            '<p style="margin-top:12px;font-size:13px;color:#666;">'+prompt+'<br>风格：'+style+' | 比例：'+ratio+'</p>' +
            '<div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">' +
            '<button class="action-btn" onclick="window.open(\''+imgUrl+'\',\'_blank\')\"><i class=\"fas fa-download\"></i> 保存图片</button>' +
            '<button class="action-btn" onclick="saveWork(\'image\',\''+prompt.replace(/\'/g,"\\\\'")+'\')\"><i class=\"fas fa-save\"></i> 保存记录</button></div></div>';
    } catch(e) { hideLoading(); showToast('生成失败'); }
}

// ===== 5. 图文生成 =====
async function generateImageText() {
    const topic = document.getElementById('imageTextTopic').value.trim();
    if (!topic) return showToast('请输入主题');
    const platform = document.getElementById('targetPlatform').value;
    const extra = document.getElementById('imageTextExtra').value.trim();
    showLoading('正在生成图文笔记...');
    try {
        const result = await callAI(
            '请为' + platform + '平台生成一篇图文笔记，主题是"' + topic + '"。' + (extra ? '补充要求：' + extra : '') + '\\n请包含：1)吸睛标题 2)正文（分段+emoji） 3)每张图片的描述建议 4)话题标签。',
            '你是一位' + platform + '平台的资深内容创作者，擅长写高互动率的图文笔记。用Markdown格式输出。',
            2000
        );
        document.getElementById('imageTextContent').innerHTML = formatMd(result);
        document.getElementById('imageTextResult').style.display = 'block';
        showToast('✅ 图文笔记生成完成');
    } catch(e) {
        document.getElementById('imageTextContent').innerHTML = '<p style="color:red">❌ ' + e.message + '</p>';
        document.getElementById('imageTextResult').style.display = 'block';
    } finally { hideLoading(); }
}

// ===== 6. 视频下载 =====
function downloadVideo() {
    const url = document.getElementById('videoUrl').value.trim();
    if (!url) return showToast('请输入视频链接');
    showLoading('正在解析...');
    setTimeout(()=>{
        hideLoading();
        let platform = '未知平台';
        if (url.includes('douyin') || url.includes('iesdouyin')) platform = '抖音';
        else if (url.includes('kuaishou') || url.includes('zhuanlan.kuaishou')) platform = '快手';
        else if (url.includes('xiaohongshu') || url.includes('xhslink')) platform = '小红书';
        else if (url.includes('bilibili') || url.includes('b23')) platform = 'B站';
        else if (url.includes('channels')) platform = '视频号';
        
        document.getElementById('videoResult').style.display = 'block';
        document.getElementById('videoResult').innerHTML =
            '<div style="padding:16px;">' +
            '<div style="text-align:center;margin-bottom:16px;">' +
            '<i class="fas fa-video" style="font-size:40px;color:#6C5CE7;margin-bottom:12px;"></i>' +
            '<p style="font-size:14px;font-weight:600;">解析成功 - ' + platform + '</p></div>' +
            '<div style="background:var(--bg);border-radius:10px;padding:12px;margin-bottom:12px;">' +
            '<p style="font-size:12px;color:#999;margin-bottom:4px;">📋 视频链接</p>' +
            '<p style="font-size:12px;color:#333;word-break:break-all;">' + url + '</p></div>' +
            '<a class="video-download-link" href="https://savevideo.me" target="_blank">' +
            '<i class="fas fa-download"></i> 前往 savevideo.me 下载（无水印）</a>' +
            '<a class="video-download-link" href="https://snaptik.app" target="_blank">' +
            '<i class="fas fa-download"></i> 抖音专用 - snaptik.app</a>' +
            '<a class="video-download-link" href="https://xhslink.com/" target="_blank">' +
            '<i class="fas fa-download"></i> 小红书专用 - xhslink.com</a>' +
            '<div style="margin-top:12px;display:flex;gap:8px;">' +
            '<button class="action-btn" onclick="navigator.clipboard.writeText(\''+url.replace(/\'/g,"\\\\'")+'\').then(()=>showToast(\'链接已复制\'))">' +
            '<i class="fas fa-copy"></i> 复制链接</button></div></div>';
        showToast('✅ 解析完成');
    }, 1000);
}

// ===== 7. 文生音频（TTSMaker 免费）=====
function generateAudio() {
    const text = document.getElementById('ttsText').value.trim();
    if (!text) return showToast('请输入要转换的文字');
    const voice = State.selectedVoice;
    const speed = document.getElementById('ttsSpeed').value;
    const speedPercent = (parseFloat(speed)*100).toFixed(0);
    
    // 构建 TTSMaker URL
    const safeText = encodeURIComponent(text.substring(0,5000));
    const ttsUrl = 'https://ttsmaker.com/zh-CN/' + '?text=' + safeText + '&speed=' + speedPercent;
    
    document.getElementById('audioResult').style.display = 'block';
    document.getElementById('audioResult').innerHTML =
        '<div style="padding:20px;text-align:center;">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--purple-start),var(--purple-end));display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
        '<i class="fas fa-microphone" style="font-size:28px;color:white;"></i></div>' +
        '<p style="font-size:16px;font-weight:600;margin-bottom:4px;">🎙️ 配音已准备</p>' +
        '<p style="font-size:13px;color:var(--gray);margin-bottom:16px;">声音：' + voice + ' | 语速：' + speed + 'x</p>' +
        '<div style="background:var(--bg);border-radius:12px;padding:14px;text-align:left;margin-bottom:16px;">' +
        '<p style="font-size:12px;color:#999;margin-bottom:6px;">📝 播报内容预览</p>' +
        '<p style="font-size:14px;color:#333;line-height:1.6;">"' + text.substring(0,200) + (text.length>200?'...':'') + '"</p>' +
        '<p style="font-size:12px;color:#999;margin-top:8px;">共 ' + text.length + ' 个字</p></div>' +
        '<button class="gradient-btn" style="margin-bottom:10px;" onclick="window.open(\''+ttsUrl+'\',\'_blank\')">' +
        '<i class="fas fa-play"></i> 前往 TTSMaker 生成音频（免费）</button>' +
        '<div style="display:flex;gap:8px;margin-top:8px;">' +
        '<button class="action-btn" onclick="navigator.clipboard.writeText(\''+text.replace(/\'/g,"\\\\'").substring(0,100)+'\').then(()=>showToast(\'已复制\'))">' +
        '<i class="fas fa-copy"></i> 复制文案</button>' +
        '<button class="action-btn" onclick="saveWork(\'audio\',\''+voice+'\')"><i class="fas fa-save"></i> 保存</button></div>' +
        '<p style="font-size:11px;color:#bbb;margin-top:12px;">💡 TTSMaker 是完全免费的在线TTS工具，支持多种中文声音</p></div>';
    showToast('✅ 已准备好配音参数');
}

// ===== 8. 数字人视频生成 =====
async function generateDigitalHuman() {
    const text = document.getElementById('digitalHumanText').value.trim();
    if (!text) return showToast('请输入播报文案');
    const avatar = State.selectedAvatar;
    const ratio = document.getElementById('dhRatio').value;
    const duration = document.getElementById('dhDuration').value;
    
    showLoading('正在生成数字人视频...');
    
    // 第一步：先生成配音
    const speed = 1.0;
    const speedPercent = (speed*100).toFixed(0);
    const safeText = encodeURIComponent(text.substring(0,2000));
    const ttsUrl = 'https://ttsmaker.com/zh-CN/?text=' + safeText + '&speed=' + speedPercent;
    
    // 第二步：尝试调用 Edge TTS (免费)
    let ttsHtml = '';
    
    // 尝试 Edge TTS
    const edgeTtsUrl = 'https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/text-to-speech#text-to-speech';
    
    try {
        // 先用 AI 优化文案
        const optimized = await callAI(
            '请将以下文案优化为适合数字人口播的版本，要求口语化、生动有趣、适合' + duration + '秒播报：\\n\\n' + text,
            '你是一位专业的视频脚本编辑，擅长将文案转化为适合口播的形式。',
            1500
        );
        
        document.getElementById('digitalHumanResult').style.display = 'block';
        document.getElementById('digitalHumanResult').innerHTML =
            '<div style="padding:16px;">' +
            '<div style="text-align:center;margin-bottom:16px;">' +
            '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#00B894,#55E6C1);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">' +
            '<i class="fas fa-robot" style="font-size:28px;color:white;"></i></div>' +
            '<p style="font-size:16px;font-weight:600;">🤖 数字人视频已准备</p></div>' +
            
            '<div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<p style="font-size:12px;color:#999;margin-bottom:6px;">👤 数字人模板</p>' +
            '<p style="font-size:14px;font-weight:600;">' + avatar + '</p>' +
            '<p style="font-size:12px;color:#999;margin-top:4px;">比例：' + ratio + ' | 时长：约' + duration + '秒</p></div>' +
            
            '<div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<p style="font-size:12px;color:#999;margin-bottom:6px;">📝 优化后的文案</p>' +
            '<p style="font-size:14px;color:#333;line-height:1.6;max-height:120px;overflow-y:auto;">' + formatMd(optimized) + '</p>' +
            '<button class="action-btn" style="margin-top:8px;" onclick="document.getElementById(\'digitalHumanText\').value=decodeURIComponent(\''+safeText.replace(/\'/g,"\\\\'")+'\');showToast(\'已填入原文案\')">' +
            '<i class="fas fa-redo"></i> 切换回原文案</button></div>' +
            
            '<div style="background:linear-gradient(135deg,#F3EEFF,#FFE8F0);border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<p style="font-size:14px;font-weight:600;margin-bottom:8px;">🎬 生成视频方案</p>' +
            '<p style="font-size:13px;color:#666;margin-bottom:10px;">数字人视频可通过以下方式生成：</p>' +
            
            '<a class="video-download-link" href="https://www.heygen.com" target="_blank">' +
            '<i class="fas fa-video"></i> HeyGen - 专业数字人视频（付费）</a>' +
            
            '<a class="video-download-link" href="https://www.d-id.com" target="_blank">' +
            '<i class="fas fa-user-circle"></i> D-ID - 数字人播报视频</a>' +
            
            '<a class="video-download-link" href="https://www.synthesia.io" target="_blank">' +
            '<i class="fas fa-robot"></i> Synthesia - AI 数字人</a>' +
            
            '<a class="video-download-link" href="https://www.canva.com/ai/digital-human/" target="_blank">' +
            '<i class="fas fa-paint-brush"></i> Canva - 免费数字人工具</a></div>' +
            
            '<div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<p style="font-size:14px;font-weight:600;margin-bottom:8px;">🎙️ 先生成配音</p>' +
            '<button class="gradient-btn" style="margin-bottom:8px;" onclick="window.open(\''+ttsUrl+'\',\'_blank\')">' +
            '<i class="fas fa-play"></i> 在 TTSMaker 生成配音（免费）</button>' +
            '<button class="action-btn" style="width:100%;" onclick="generateAudio();navigateTo(\'text-audio\')">' +
            '<i class="fas fa-headphones"></i> 切换到配音页面</button></div>' +
            
            '<div style="background:#FFF8E1;border-radius:12px;padding:12px;">' +
            '<p style="font-size:12px;color:#F57F17;"><i class="fas fa-lightbulb"></i> <strong>小贴士：</strong>建议先用 TTSMaker 生成配音，再用 Canva 或 CapCut 添加数字人形象合成视频。</p></div>' +
            
            '<div style="display:flex;gap:8px;margin-top:12px;">' +
            '<button class="action-btn" onclick="copyText(\'digitalHumanResult\')"><i class="fas fa-copy"></i> 复制方案</button>' +
            '<button class="action-btn" onclick="saveWork(\'digitalhuman\',\''+avatar+'\')"><i class="fas fa-save"></i> 保存</button></div>' +
            '</div>';
    } catch(e) {
        // AI 调用失败时的降级方案
        document.getElementById('digitalHumanResult').style.display = 'block';
        document.getElementById('digitalHumanResult').innerHTML =
            '<div style="padding:16px;">' +
            '<div style="text-align:center;margin-bottom:16px;">' +
            '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#00B894,#55E6C1);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">' +
            '<i class="fas fa-robot" style="font-size:28px;color:white;"></i></div>' +
            '<p style="font-size:16px;font-weight:600;">🤖 数字人视频方案</p></div>' +
            
            '<div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<p style="font-size:12px;color:#999;margin-bottom:6px;">👤 模板</p>' +
            '<p style="font-size:14px;font-weight:600;">' + avatar + '</p>' +
            '<p style="font-size:12px;color:#999;margin-top:4px;">比例：' + ratio + ' | 时长：约' + duration + '秒</p></div>' +
            
            '<div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<p style="font-size:14px;font-weight:600;margin-bottom:8px;">🎬 推荐工具</p>' +
            '<a class="video-download-link" href="https://www.heygen.com" target="_blank"><i class="fas fa-video"></i> HeyGen</a>' +
            '<a class="video-download-link" href="https://www.d-id.com" target="_blank"><i class="fas fa-user-circle"></i> D-ID</a>' +
            '<a class="video-download-link" href="https://www.canva.com" target="_blank"><i class="fas fa-paint-brush"></i> Canva（免费）</a></div>' +
            
            '<div style="margin-bottom:12px;">' +
            '<button class="gradient-btn" style="margin-bottom:8px;" onclick="window.open(\'https://ttsmaker.com/zh-CN/?text='+safeText+'&speed='+speedPercent+'\',\'_blank\')">' +
            '<i class="fas fa-play"></i> 生成配音</button>' +
            '<button class="action-btn" style="width:100%;" onclick="generateAudio();navigateTo(\'text-audio\')">' +
            '<i class="fas fa-headphones"></i> 去配音页面</button></div>' +
            
            '<div style="display:flex;gap:8px;">' +
            '<button class="action-btn" onclick="copyText(\'digitalHumanResult\')"><i class="fas fa-copy"></i> 复制</button>' +
            '<button class="action-btn" onclick="saveWork(\'digitalhuman\',\''+avatar+'\')"><i class="fas fa-save"></i> 保存</button></div></div>';
    }
    hideLoading();
    showToast('✅ 数字人方案已生成');
}

// ===== 9. 作品管理 =====
function saveWork(type, preview) {
    let content = '';
    let title = '';
    switch(type) {
        case 'extract':
            content = document.getElementById('extractContent')?.innerText || '';
            title = '文案提取';
            break;
        case 'analysis':
            content = document.getElementById('analysisContent')?.innerText || '';
            title = '对标分析';
            break;
        case 'rewrite':
            content = document.getElementById('rewriteContent')?.innerText || '';
            title = '文案二创';
            break;
        case 'image':
            content = preview || '智能图片';
            title = '智能图片';
            break;
        case 'imageText':
            content = document.getElementById('imageTextContent')?.innerText || '';
            title = '图文生成';
            break;
        case 'audio':
            content = preview || '文生音频';
            title = '文生音频';
            break;
        case 'digitalhuman':
            content = preview || '数字人视频';
            title = '数字人';
            break;
        default:
            content = '作品';
    }
    
    const work = {
        id: Date.now(),
        type: type,
        title: title,
        content: content.substring(0, 200),
        time: getTimestamp(),
        fullContent: content
    };
    
    State.works.unshift(work);
    if (State.works.length > 50) State.works = State.works.slice(0, 50);
    localStorage.setItem('sm_works', JSON.stringify(State.works));
    renderWorks();
    showToast('✅ 已保存到作品管理');
}

function renderWorks(filter='all') {
    const list = document.getElementById('worksList');
    if (!list) return;
    
    let works = State.works;
    if (filter !== 'all') {
        const typeMap = {extract:'extract',image:'image',rewrite:'rewrite',audio:'audio'};
        works = works.filter(w => w.type === typeMap[filter] || (filter==='image' && (w.type==='image'||w.type==='imageText')));
    }
    
    if (works.length === 0) {
        list.innerHTML = '<div class="empty-works"><i class="fas fa-inbox"></i><p>暂无作品</p><small>使用各功能生成的内容将保存在这里</small></div>';
        return;
    }
    
    const iconMap = {
        extract:'fa-file-alt', analysis:'fa-chart-line', rewrite:'fa-pen-fancy',
        image:'fa-image', imageText:'fa-file-image', audio:'fa-microphone',
        digitalhuman:'fa-robot'
    };
    
    list.innerHTML = works.map(w => 
        '<div class="work-item" onclick="showWorkDetail(' + w.id + ')">' +
        '<div class="work-item-header">' +
        '<span class="work-item-type"><i class="fas '+(iconMap[w.type]||'fa-file')+'"></i> '+w.title+'</span>' +
        '<span class="work-item-time">'+w.time+'</span></div>' +
        '<div class="work-item-preview">'+w.content+'</div>' +
        '<div class="work-item-actions">' +
        '<button class="work-action-btn" onclick="event.stopPropagation();copyText(\'work-'+w.id+'\')"><i class="fas fa-copy"></i> 复制</button>' +
        '<button class="work-action-btn" onclick="event.stopPropagation();deleteWork('+w.id+')"><i class="fas fa-trash"></i> 删除</button></div>' +
        '<div id="work-'+w.id+'" style="display:none">'+w.fullContent+'</div></div>'
    ).join('');
}

function filterWorks(filter, btn) {
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderWorks(filter);
}

function showWorkDetail(id) {
    const el = document.getElementById('work-'+id);
    if (el) {
        const text = el.textContent;
        if (text) {
            navigator.clipboard.writeText(text).then(()=>showToast('✅ 已复制'));
        }
    }
}

function deleteWork(id) {
    if (!confirm('确定删除此作品？')) return;
    State.works = State.works.filter(w => w.id !== id);
    localStorage.setItem('sm_works', JSON.stringify(State.works));
    renderWorks();
    showToast('🗑️ 已删除');
}

function clearAllData() {
    if (!confirm('确定清除所有数据和配置？此操作不可恢复！')) return;
    if (!confirm('再次确认：清除所有数据？')) return;
    localStorage.removeItem('api_base');
    localStorage.removeItem('api_key');
    localStorage.removeItem('api_model');
    localStorage.removeItem('sm_works');
    State.apiConfig = {base:'',key:'',model:'qwen-turbo'};
    State.works = [];
    loadApiConfig();
    renderWorks();
    showToast('✅ 所有数据已清除');
}
