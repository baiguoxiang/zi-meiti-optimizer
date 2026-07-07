// ===== 全局状态 =====
const State = {
    avatarPhotos: JSON.parse(localStorage.getItem('avatar_photos') || '{}'),
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
    },
    siliconFlow: {
        base: localStorage.getItem('sf_base') || 'https://api.siliconflow.cn/v1',
        key: localStorage.getItem('sf_key') || '',
        model: localStorage.getItem('sf_model') || 'Qwen/Qwen2.5-72B-Instruct'
    }
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 60000);
    loadApiConfig();
    loadSiliconFlowConfig();
    renderWorks();
    preloadAvatarImages();
    loadAvatarPhotos();
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


// ===== 8. 数字人视频生成（纯前端 Canvas 方案）=====

// ===== 上传真人照片 =====
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        const fileName = file.name.replace(/\.[^/.]+$/, "").toLowerCase();
        let matchedAvatar = "";
        const avatarNames = ["依菱","沐沐","明轩","林靖","一诺","林延","管管","江宁","林浩"];
        
        for (const name of avatarNames) {
            if (fileName.includes(name.toLowerCase())) {
                matchedAvatar = name;
                break;
            }
        }
        
        if (!matchedAvatar) {
            matchedAvatar = prompt("请输入对应的头像名称 (依菱/沐沐/明轩/林靖/一诺/林延/管管/江宁/林浩):", "依菱");
        }
        
        if (matchedAvatar) {
            State.avatarPhotos[matchedAvatar] = base64;
            // ???????
            const tempImg = new Image();
            tempImg.src = base64;
            State.avatarImageObjects = State.avatarImageObjects || {};
            State.avatarImageObjects[matchedAvatar] = tempImg;
            
            localStorage.setItem("avatar_photos", JSON.stringify(State.avatarPhotos));
            updateAvatarDisplay(matchedAvatar, base64);
            showToast("✅ 已上传 " + matchedAvatar + " 的照片");
        }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
}

function updateAvatarDisplay(name, base64) {
    const cards = document.querySelectorAll(".avatar-card");
    cards.forEach(card => {
        const onclickStr = card.getAttribute("onclick") || "";
        const match = onclickStr.match(/'([^']+)'/);
        if (match && match[1] === name) {
            const imgDiv = card.querySelector(".avatar-img");
            if (imgDiv) {
                imgDiv.innerHTML = '<img src="' + base64 + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
            }
        }
    });
}

// ===== 数字人生成 =====

function preloadAvatarImages() {
    if (!State.avatarImageObjects) State.avatarImageObjects = {};
    for (const name in State.avatarPhotos) {
        if (State.avatarPhotos[name] && !State.avatarImageObjects[name]) {
            const img = new Image();
            img.src = State.avatarPhotos[name];
            State.avatarImageObjects[name] = img;
        }
    }
}

// ===== 数字人生成（简化可靠版）=====
async function generateDigitalHuman() {
    const text = document.getElementById('digitalHumanText').value.trim();
    if (!text) return showToast('请输入播报文案');
    const avatar = State.selectedAvatar;
    const ratio = document.getElementById('dhRatio').value;
    const duration = document.getElementById('dhDuration').value;
    showLoading('正在生成数字人视频...');
    try {
        showToast('📝 AI 正在优化文案...');
        const optimized = await callAI(
            '请将以下文案优化为适合数字人口播的版本，要求口语化、生动有趣、适合' + duration + '秒播报：\n\n' + text,
            '你是一位专业的视频脚本编辑，擅长将文案转化为适合口播的形式。',
            1500
        );
        
        showToast('🎬 正在合成视频...');
        const videoBlob = await renderDigitalHumanVideoWithAudio(avatar, optimized, ratio, null);
        const videoUrl = URL.createObjectURL(videoBlob);
        
        document.getElementById('digitalHumanResult').style.display = 'block';
        document.getElementById('digitalHumanResult').innerHTML = buildDHResultSimple(avatar, ratio, duration, optimized, videoUrl);
        showToast('✅ 数字人视频生成成功！');
    } catch(e) {
        console.error('Digital human error:', e);
        document.getElementById('digitalHumanResult').style.display = 'block';
        document.getElementById('digitalHumanResult').innerHTML = buildDHError(e.message, text, avatar);
        showToast('❌ 生成失败：' + e.message);
    }
    hideLoading();
}

function buildDHResultSimple(avatar, ratio, duration, optimized, videoUrl) {
    const ratioLabels = {'9:16':'竖屏 9:16','16:9':'横屏 16:9','1:1':'方形 1:1'};
    return '<div style="padding:16px;">' +
        '<div style="text-align:center;margin-bottom:16px;">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#00B894,#55E6C1);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">' +
        '<i class="fas fa-check-circle" style="font-size:28px;color:white;"></i></div>' +
        '<p style="font-size:16px;font-weight:600;">🎉 数字人视频生成成功！</p>' +
        '<p style="font-size:13px;color:#666;margin-top:4px;">全部在浏览器内完成，无需跳转任何网站</p></div>' +
        '<div style="background:#F5F6FA;border-radius:12px;padding:14px;margin-bottom:12px;">' +
        '<p style="font-size:12px;color:#999;margin-bottom:6px;">👤 数字人模板</p>' +
        '<p style="font-size:14px;font-weight:600;">' + avatar + '</p>' +
        '<p style="font-size:12px;color:#999;margin-top:4px;">比例：' + (ratioLabels[ratio]||ratio) + ' | 时长：约' + duration + '秒</p></div>' +
        '<div style="background:#F5F6FA;border-radius:12px;padding:14px;margin-bottom:12px;">' +
        '<p style="font-size:12px;color:#999;margin-bottom:6px;">📝 优化后的文案</p>' +
        '<p style="font-size:14px;color:#333;line-height:1.6;max-height:100px;overflow-y:auto;">' + formatMd(optimized) + '</p></div>' +
        '<div style="background:linear-gradient(135deg,#F3EEFF,#FFE8F0);border-radius:12px;padding:14px;margin-bottom:12px;">' +
        '<p style="font-size:14px;font-weight:600;margin-bottom:8px;">🎬 生成视频</p>' +
        '<video id="dhVideoPlayer" controls style="width:100%;border-radius:10px;margin-bottom:10px;background:#000;"><source src="' + videoUrl + '" type="video/webm"></video>' +
        '<a href="' + videoUrl + '" download="数字人视频_' + avatar + '.webm" class="gradient-btn" style="text-decoration:none;display:block;text-align:center;">' +
        '<i class="fas fa-download"></i> 下载视频 (WebM)</a></div>' +
        '<div style="background:#FFF3E0;border-radius:12px;padding:12px;margin-bottom:12px;">' +
        '<p style="font-size:13px;color:#E65100;"><i class="fas fa-volume-up"></i> <strong>提示：</strong>视频为无声版本。如需配音，请使用下方"文生音频"功能单独生成音频，然后在剪辑软件中合并。</p></div>' +
        '<div style="background:#E8F5E9;border-radius:12px;padding:12px;margin-bottom:12px;">' +
        '<p style="font-size:13px;color:#2E7D32;"><i class="fas fa-check-circle"></i> <strong>生成流程：</strong><br>' +
        '① AI 优化文案 → ② Canvas 合成视频（头像+字幕+动画）→ ③ 下载播放</p></div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="action-btn" onclick="copyText(\'digitalHumanResult\')"><i class="fas fa-copy"></i> 复制方案</button>' +
        '<button class="action-btn" onclick="saveWork(\'digitalhuman\',\'' + avatar.replace(/'/g, "\\\\'") + '\')"><i class="fas fa-save"></i> 保存</button></div></div>';
}

function buildDHError(msg, text, avatar) {
    const safeMsg = String(msg || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const safeText = String(text || "").substring(0, 100).replace(/'/g,"\'");
    return "<div style=\"padding:16px;\">" +
        "<div style=\"text-align:center;margin-bottom:16px;\">" +
        "<div style=\"width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#FF6B6B,#FF8E8E);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;\">" +
        "<i class=\"fas fa-exclamation-triangle\" style=\"font-size:28px;color:white;\"></i></div>" +
        "<p style=\"font-size:16px;font-weight:600;\">?? ????</p></div>" +
        "<div style=\"background:#FFF3E0;border-radius:12px;padding:14px;margin-bottom:12px;\">" +
        "<p style=\"font-size:14px;color:#E65100;\">" + safeMsg + "</p></div>" +
        "<div style=\"background:#F5F6FA;border-radius:12px;padding:14px;margin-bottom:12px;\">" +
        "<p style=\"font-size:14px;font-weight:600;margin-bottom:8px;\">?? ????</p>" +
        "<button class=\"action-btn\" style=\"width:100%;margin-bottom:8px;\" onclick=\"generateAudio();navigateTo(\x27text-audio\x27)\">" +
        "<i class=\"fas fa-microphone\"></i> ?????</button>" +
        "<button class=\"action-btn\" style=\"width:100%;margin-bottom:8px;\" onclick=\"navigator.clipboard.writeText(\x27" + safeText + "\x27).then(()=>showToast(\x27?????\x27))\">" +
        "<i class=\"fas fa-copy\"></i> ????</button></div>" +
        "<button class=\"action-btn\" style=\"width:100%;\" onclick=\"generateDigitalHuman()\">" +
        "<i class=\"fas fa-redo\"></i> ??</button></div>";
}



function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getAvatarColors(avatarName) {
    const cleaned = avatarName.replace(/[-s]/g, "");
    const colors = {
        '??': { primary: '#f093fb', secondary: '#f5576c' },
        '??': { primary: '#4facfe', secondary: '#00f2fe' },
        '??': { primary: '#667eea', secondary: '#764ba2' },
        '??': { primary: '#43e97b', secondary: '#38f9d7' },
        '??': { primary: '#fa709a', secondary: '#fee140' },
        '??': { primary: '#a18cd1', secondary: '#fbc2eb' },
        '??': { primary: '#ffecd2', secondary: '#fcb69f' },
        '??': { primary: '#667eea', secondary: '#764ba2' },
        '??': { primary: '#43e97b', secondary: '#38f9d7' }
    };
    return colors[cleaned] || colors['??'];
}

function splitScript(script, maxWidth) {
    const charsPerLine = Math.floor(maxWidth / 18);
    const result = [];
    for (let i = 0; i < script.length; i += charsPerLine) {
        result.push(script.substring(i, i + charsPerLine));
    }
    return result;
}

// ===== ???????????????=====
async function drawAvatarPortrait(ctx, avatarName, canvasW, canvasH, elapsed) {
    const colors = getAvatarColors(avatarName);
    const cx = canvasW / 2;
    const cy = canvasH * 0.35;
    const hasPhoto = State.avatarPhotos && State.avatarPhotos[avatarName];
    
    // ????????
    let img = null;
    if (hasPhoto && State.avatarImageObjects && State.avatarImageObjects[avatarName]) {
        img = State.avatarImageObjects[avatarName];
    }
    
    // 1. ??????????
    const bodyTopY = cy + 50;
    const bodyH = canvasH * 0.28;
    const bodyW = canvasW * 0.42;
    const bodyGrad = ctx.createLinearGradient(cx - bodyW/2, bodyTopY, cx + bodyW/2, bodyTopY + bodyH);
    bodyGrad.addColorStop(0, colors.primary);
    bodyGrad.addColorStop(1, colors.secondary);
    ctx.fillStyle = bodyGrad;
    
    // ????
    ctx.beginPath();
    ctx.moveTo(cx - bodyW/2, bodyTopY + bodyH);
    ctx.quadraticCurveTo(cx - bodyW/2 - 5, bodyTopY + 20, cx - bodyW/3, bodyTopY);
    ctx.lineTo(cx - 10, bodyTopY + 15);
    ctx.lineTo(cx, bodyTopY + 5);
    ctx.lineTo(cx + 10, bodyTopY + 15);
    ctx.lineTo(cx + bodyW/3, bodyTopY);
    ctx.quadraticCurveTo(cx + bodyW/2 + 5, bodyTopY + 20, cx + bodyW/2, bodyTopY + bodyH);
    ctx.closePath();
    ctx.fill();
    
    // ????V?
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(cx - 12, bodyTopY + 10);
    ctx.lineTo(cx, bodyTopY + 35);
    ctx.lineTo(cx + 12, bodyTopY + 10);
    ctx.closePath();
    ctx.fill();
    
    // 2. ????
    const headR = Math.min(canvasW, canvasH) * 0.13;
    
    if (img && img.complete && img.naturalWidth > 0) {
        // ??????????
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, headR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // ????
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let dw, dh;
        if (imgRatio > 1) {
            dh = headR * 2;
            dw = dh * imgRatio;
        } else {
            dw = headR * 2;
            dh = dw / imgRatio;
        }
        ctx.drawImage(img, cx - dw/2, cy - dh/2, dw, dh);
        ctx.restore();
        
        // ??????
        ctx.strokeStyle = colors.primary + "80";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, headR + 2, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        // ??????????
        const headGrad = ctx.createRadialGradient(cx - headR*0.3, cy - headR*0.3, 0, cx, cy, headR);
        headGrad.addColorStop(0, "#FDEBD0");
        headGrad.addColorStop(1, "#F5CBA7");
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, headR, 0, Math.PI * 2);
        ctx.fill();
        
        // ??
        ctx.fillStyle = "#3D2B1F";
        ctx.beginPath();
        ctx.arc(cx, cy - 5, headR + 2, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // ??
        ctx.fillStyle = "#333";
        const eyeY = cy + 2;
        const eyeSpacing = headR * 0.3;
        const blinkPhase = Math.sin(elapsed * 0.5);
        const eyeH = blinkPhase > 0.95 ? 1 : headR * 0.1;
        ctx.beginPath();
        ctx.ellipse(cx - eyeSpacing, eyeY, headR * 0.1, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + eyeSpacing, eyeY, headR * 0.1, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ????????
        const mouthY = cy + headR * 0.35;
        const mouthOpen = Math.abs(Math.sin(elapsed * 3)) * 3 + 1;
        ctx.fillStyle = "#E53E3E";
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, headR * 0.12, mouthOpen, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 3. ????
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    const nameText = avatarName;
    ctx.font = "bold " + (headR * 0.7) + "px sans-serif";
    const nameW = ctx.measureText(nameText).width;
    const nameBgX = cx - nameW/2 - 12;
    const nameBgY = bodyTopY + bodyH - 10;
    ctx.beginPath();
    ctx.roundRect(nameBgX, nameBgY, nameW + 24, headR * 0.7 + 8, 6);
    ctx.fill();
    
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nameText, cx, nameBgY + (headR * 0.7 + 8) / 2);
}
// ????????Canvas ?? + ???
async function renderDigitalHumanVideoWithAudio(avatar, script, ratio, audioBuffer) {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const dims = getRatioDimensions(ratio);
        canvas.width = dims.w;
        canvas.height = dims.h;
        const ctx = canvas.getContext("2d");
        
        const startTime = Date.now();
        const totalChars = script.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "").length;
        const totalDuration = Math.max(8, Math.min(totalChars * 0.25, 120));
        
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
        recorder.start();
        
        const textLines = splitScript(script, canvas.width * 0.75);
        let currentLine = 0;
        let lineCharIndex = 0;
        
        function drawFrame() {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed >= totalDuration + 1) { recorder.stop(); return; }
            
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, "#0f0c29");
            grad.addColorStop(0.5, "#1a1a3e");
            grad.addColorStop(1, "#24243e");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < 20; i++) {
                const px = (Math.sin(elapsed * 0.2 + i * 1.3) * 0.5 + 0.5) * canvas.width;
                const py = (Math.cos(elapsed * 0.15 + i * 1.7) * 0.5 + 0.5) * canvas.height * 0.6;
                ctx.fillStyle = "rgba(147, 130, 225, 0.12)";
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            drawAvatarPortrait(ctx, avatar, canvas.width, canvas.height, elapsed);
            
            const subtitleY = canvas.height * 0.62;
            const subtitleH = canvas.height * 0.33;
            ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
            ctx.beginPath();
            ctx.roundRect(canvas.width * 0.04, subtitleY, canvas.width * 0.92, subtitleH, 12);
            ctx.fill();
            
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            const fontSize = Math.max(14, canvas.width * 0.035);
            ctx.font = fontSize + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
            
            const currentScript = textLines[currentLine] || "";
            const displayText = currentScript.substring(0, Math.max(0, lineCharIndex));
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.fillText(displayText, canvas.width * 0.08, subtitleY + subtitleH * 0.45);
            ctx.shadowColor = "transparent";
            
            const progress = Math.min(elapsed / totalDuration, 1);
            const barY = subtitleY + subtitleH - 16;
            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.beginPath();
            ctx.roundRect(canvas.width * 0.06, barY, canvas.width * 0.88, 4, 2);
            ctx.fill();
            const progGrad = ctx.createLinearGradient(canvas.width * 0.06, 0, canvas.width * 0.94, 0);
            progGrad.addColorStop(0, "#667eea");
            progGrad.addColorStop(1, "#764ba2");
            ctx.fillStyle = progGrad;
            ctx.beginPath();
            ctx.roundRect(canvas.width * 0.06, barY, canvas.width * 0.88 * progress, 4, 2);
            ctx.fill();
            
            const secs = Math.floor(elapsed);
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = (fontSize * 0.7) + "px monospace";
            ctx.textAlign = "right";
            ctx.fillText((Math.floor(secs/60).toString().padStart(2,"0") + ":" + (secs%60).toString().padStart(2,"0")), canvas.width * 0.94, barY - 6);
            
            if (elapsed > 0.3 && Math.floor(elapsed / 1.8) > currentLine) {
                currentLine = Math.min(Math.floor(elapsed / 1.8), textLines.length - 1);
                lineCharIndex = 0;
            }
            lineCharIndex = Math.min(lineCharIndex + 2, currentScript.length);
            
            requestAnimationFrame(drawFrame);
        }
        
        drawFrame();
    });
}

function getRatioDimensions(ratio) {
    switch(ratio) {
        case '9:16': return { w: 540, h: 960 };
        case '16:9': return { w: 960, h: 540 };
        case '1:1': return { w: 720, h: 720 };
        default: return { w: 540, h: 960 };
    }
}
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
    loadAvatarPhotos();
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
    loadAvatarPhotos();
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
    loadSiliconFlowConfig();
    renderWorks();
    loadAvatarPhotos();
    showToast('✅ 所有数据已清除');
}



















function loadSiliconFlowConfig() {
    const b = document.getElementById('sfApiBase');
    const k = document.getElementById('sfApiKey');
    const m = document.getElementById('sfModelName');
    if (b) b.value = State.siliconFlow.base;
    if (k) k.value = State.siliconFlow.key;
    if (m) m.value = State.siliconFlow.model;
}

function saveSiliconFlowConfig() {
    const base = document.getElementById('sfApiBase').value.trim().replace(/\/+$/,'');
    const key = document.getElementById('sfApiKey').value.trim();
    const model = document.getElementById('sfModelName').value.trim() || 'Qwen/Qwen2.5-72B-Instruct';
    State.siliconFlow.base = base;
    State.siliconFlow.key = key;
    State.siliconFlow.model = model;
    localStorage.setItem('sf_base', base);
    localStorage.setItem('sf_key', key);
    localStorage.setItem('sf_model', model);
    const s = document.getElementById('sfApiStatus');
    if (s) {
        if (key) { s.textContent = '配置已保存'; s.className = 'api-status success'; }
        else { s.textContent = '请填写API Key'; s.className = 'api-status error'; }
    }
    showToast(key ? '硅基流动配置已保存' : '请填写API Key');
}

async function generateDigitalHumanSF() {
    const text = document.getElementById('digitalHumanText').value.trim();
    if (!text) return showToast('请输入播报文案');
    const avatar = State.selectedAvatar;
    const ratio = document.getElementById('dhRatio').value;
    const duration = document.getElementById('dhDuration').value;
    showLoading('正在调用硅基流动 API...');
    try {
        const config = State.siliconFlow;
        if (!config.key) {
            hideLoading();
            showToast('请先在设置中配置硅基流动 API Key');
            return;
        }
        const url = config.base.replace(/\/+$/,'') + '/v1/images/generations';
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Authorization': 'Bearer ' + config.key, 'Content-Type': 'application/json'},
            body: JSON.stringify({
                prompt: 'Digital human: ' + avatar + '. Text: ' + text.substring(0, 200),
                model: config.model, n: 1,
                size: ratio === '9:16' ? '1080x1920' : ratio === '16:9' ? '1920x1080' : '1024x1024'
            })
        });
        if (!response.ok) throw new Error('API请求失败(' + response.status + ')');
        const result = await response.json();
        const imageUrl = result.data && result.data[0] ? result.data[0].url : '';
        document.getElementById('digitalHumanResult').style.display = 'block';
        let html = '<div style="padding:16px;">';
        html += '<div style="text-align:center;margin-bottom:16px;">';
        html += '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#00B894,#55E6C1);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">';
        html += '<i class="fas fa-check-circle" style="font-size:28px;color:white;"></i></div>';
        html += '<p style="font-size:16px;font-weight:600;">数字人图像生成成功！</p></div>';
        html += '<div style="background:#F5F6FA;border-radius:12px;padding:14px;margin-bottom:12px;">';
        html += '<p style="font-size:12px;color:#999;margin-bottom:6px;">数字人模板</p>';
        html += '<p style="font-size:14px;font-weight:600;">' + avatar + '</p>';
        html += '<p style="font-size:12px;color:#999;margin-top:4px;">比例：' + ratio + ' | 时长：约' + duration + '秒</p></div>';
        if (imageUrl) {
            html += '<div style="background:linear-gradient(135deg,#F3EEFF,#FFE8F0);border-radius:12px;padding:14px;margin-bottom:12px;">';
            html += '<p style="font-size:14px;font-weight:600;margin-bottom:8px;">生成图像</p>';
            html += '<img src="' + imageUrl + '" style="width:100%;border-radius:10px;margin-bottom:10px;">';
            html += '<a href="' + imageUrl + '" download="数字人_' + avatar + '.png" class="gradient-btn" style="text-decoration:none;display:block;text-align:center;">下载图像</a></div>';
        }
        html += '<div style="background:#E8F5E9;border-radius:12px;padding:12px;margin-bottom:12px;">';
        html += '<p style="font-size:13px;color:#2E7D32;">提示：当前生成的是静态图像。如需视频，建议使用腾讯智影、百度智能云等专业 API。</p></div>';
        html += '<div style="display:flex;gap:8px;">';
        html += '<button class="action-btn" onclick="saveWork(digitalhuman,' + avatar.replace(/'/g, "'") + ')"><i class="fas fa-save"></i> 保存</button></div></div>';
        document.getElementById('digitalHumanResult').innerHTML = html;
        showToast('数字人图像生成成功！');
    } catch(e) {
        console.error('Error:', e);
        document.getElementById('digitalHumanResult').style.display = 'block';
        document.getElementById('digitalHumanResult').innerHTML = buildDHError(e.message, text, avatar);
        showToast('生成失败：' + e.message);
    }
    hideLoading();
}

