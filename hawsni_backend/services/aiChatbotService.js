const { GoogleGenAI } = require("@google/genai");
const supabase = require('../config/supabase');

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const REASONER_MODEL  = "gemma-4-31b-it"; 
const FORMATTER_MODEL = "gemma-4-31b-it"; 
const MAX_RESULTS     = 5;
const MAX_ORDERS      = 3;

const STATUS_MAP = {
    Pending:    'قيد الانتظار',
    Processing: 'جاري التجهيز',
    Shipped:    'تم الشحن / مع المندوب',
    Delivered:  'تم التوصيل',
    Cancelled:  'ملغي',
};

// ─────────────────────────────────────────────
//  TOOLS (الأدوات)
// ─────────────────────────────────────────────
const TOOLS = [{
    functionDeclarations: [
        {
            name: "search_products",
            description: "ابحث عن المنتجات المتاحة في متجر Hawsni بناءً على اسم أو نوع.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "كلمة البحث" }
                },
                required: ["query"]
            }
        },
        {
            name: "check_order_status",
            description: "استعلام عن حالة طلبات العميل باستخدام رقم هاتفه.",
            parameters: {
                type: "object",
                properties: {
                    phone_number: { type: "string", description: "رقم هاتف العميل" }
                },
                required: ["phone_number"]
            }
        },
        {
            name: "check_inventory",
            description: "تحقق من المخزون الحالي لمنتج معين لمعرفة الكمية المتبقية.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "اسم المنتج" }
                },
                required: ["query"]
            }
        },
        {
            name: "request_cancellation",
            description: "قم بإنشاء طلب إلغاء لطلب معين إذا طلب العميل إلغاءه. يجب التأكد من امتلاكك رقم الهاتف ورقم الأوردر.",
            parameters: {
                type: "object",
                properties: {
                    order_number: { type: "string", description: "رقم الطلب المراد إلغاؤه" },
                    phone_number: { type: "string", description: "رقم الهاتف المربوط بالطلب" },
                    reason: { type: "string", description: "سبب الإلغاء الذي ذكره العميل" }
                },
                required: ["order_number", "phone_number"]
            }
        },
        {
            name: "request_human_agent",
            description: "استدعِ موظف بشري إذا واجهت مشكلة معقدة أو غضب العميل أو لم تجد حلاً.",
            parameters: {
                type: "object",
                properties: {
                    reason: { type: "string", description: "لماذا تطلب الدعم البشري؟" }
                },
                required: ["reason"]
            }
        }
    ]
}];

// ─────────────────────────────────────────────
//  SYSTEM INSTRUCTIONS
// ─────────────────────────────────────────────

// الموديل الأول: العقل المدبر (يقرر استدعاء الأدوات فقط)
const TOOLS_SYSTEM = `
أنت العقل المدبر لمتجر hwasi للأزياء الفاخرة. 
مهمتك الوحيدة: تقرر هل تحتاج لاستدعاء أداة أم لا بناءً على طلب العميل.
- إذا احتجت أداة مثل البحث عن منتج أو تتبع طلب، استدعِها فوراً.
- إذا لم تحتج لأي أداة (مثلاً العميل يلقي التحية فقط)، لا تستدعِ شيئاً.
- ردك يجب أن يكون مباشراً وبدون شرح مطول لخطواتك (Chain of Thought).
`.trim();

// الموديل الثاني: الواجهة (يصيغ الرد النهائي كـ JSON)
const FORMAT_SYSTEM = `
أنت مساعد متجر hwasi للأزياء الفاخرة. 
قواعد صارمة جداً (CRITICAL):
1. يجب أن ترد دائماً بـ JSON object يحتوي مفتاح "reply" فقط.
2. لا تكتب أي شيء خارج كائن الـ JSON. 
3. الرد داخل "reply" يجب أن يكون بالعربية النظيفة، راقياً، مختصراً، ومباشراً.
4. إذا لم يذكر العميل اسمه في المحادثة الحالية (أو الملخص)، اطلب منه اسمه بلطف في أول فرصة "لتنظيم الخدمة".
5. إذا تم توفير بيانات من النظام، اعرضها بوضوح للعميل.
6. لا تفصح أبداً عن بيانات شخصية كاملة للعملاء.

مثال للرد الصحيح:
{"reply": "وعليكم السلام، أهلاً بك في hwasi. ممكن أتشرف بحضرتك؟ وكيف يمكنني مساعدتك اليوم؟"}
`.trim();

// الموديل الثالث: الملخص (يختصر المحادثة)
const SUMMARIZER_SYSTEM = `
أنت خبير في تلخيص محادثات العملاء لمتجر أزياء. 
مهمتك: استخراج أهم البيانات (اسم العميل، المنتجات التي أعجبته، مقاساته، ذوقه) في سطرين فقط لمساعدة البوت في المرة القادمة.
`.trim();

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function normalizePhone(raw) {
    if (!raw) return "";
    let p = raw.trim().replace(/\s+/g, '');
    if (p.startsWith('+20'))                   p = '0' + p.slice(3);
    if (p.startsWith('20') && p.length === 12) p = '0' + p.slice(2);
    return p.length >= 10 ? p.slice(-10) : p;
}

function formatOrder(o) {
    return {
        order_number: o.order_number || String(o.id).slice(0, 8),
        status:       STATUS_MAP[o.status] || o.status,
        total_egp:    o.total,
        date:         new Date(o.created_at).toLocaleDateString('ar-EG'),
    };
}

// دالة التنظيف المتقدمة - تسحب العربي فقط وتزيل مخلفات الموديل
function cleanModelText(text) {
    if (!text) return "";
    
    // 1. إزالة التاجات التقنية
    let cleaned = text
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<\|?channel>thought<\|?channel\/?>/gi, '')
        .replace(/<\|think\|>[\s\S]*?<\|\/?think\|>/gi, '')
        .replace(/^\*.*$/gm, '');

    // 2. البحث عن الرد العربي الفعلي وترك الرغي الإنجليزي في البداية
    const firstArabicIndex = cleaned.search(/[\u0600-\u06FF]/);
    if (firstArabicIndex !== -1) {
        const beforeArabic = cleaned.substring(0, firstArabicIndex);
        if (beforeArabic.length > 30 || beforeArabic.includes('Plan')) {
            cleaned = cleaned.substring(firstArabicIndex);
        }
    }

    // 3. تنظيف الترجمات الإنجليزية بين قوسين
    cleaned = cleaned.replace(/[\u0600-\u06FF](\s*)\(.*?[a-zA-Z]{3,}.*?\)/g, (match) => match.charAt(0));

    return cleaned.trim();
}

// ─────────────────────────────────────────────
//  SERVICE CLASS
// ─────────────────────────────────────────────
class AIChatbotService {
    constructor() {
        this.apiKeys = Object.keys(process.env)
            .filter(k => k.startsWith('GEMINI_API_KEY'))
            .sort((a, b) => a.localeCompare(b))
            .map(k => process.env[k])
            .filter(key => key && (key.startsWith('AIza') || key.startsWith('AQ.')));

        if (!this.apiKeys.length) {
            console.warn('[AI Bot] ⚠️ No GEMINI_API_KEYs found in .env');
            return;
        }

        console.log(`[AI Bot] ✅ ${this.apiKeys.length} API key(s) loaded for rotation.`);
        this.genAIInstances  = this.apiKeys.map(k => new GoogleGenAI({ apiKey: k }));
        this.currentKeyIndex = 0;
    }

    // ── Key rotation ───────────────────────────
    _getInstance() {
        if (!this.genAIInstances?.length) throw new Error('AI not initialized. Check API Keys.');
        const inst = this.genAIInstances[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.genAIInstances.length;
        return inst;
    }

    // ── Retry with all keys on 429 ─────────────
    async _generateWithRetry(modelName, config, contents) {
        const totalKeys = this.genAIInstances.length;
        let lastError;
        for (let attempt = 0; attempt < totalKeys; attempt++) {
            const instance = this._getInstance();
            try {
                return await instance.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: config
                });
            } catch (err) {
                lastError = err;
                if (err.status === 429) {
                    console.warn(`[AI Bot] ⚠️ Key ${attempt + 1}/${totalKeys} rate limited. Trying next key...`);
                    await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
                    continue;
                }
                throw err; // Non-429 errors: throw immediately
            }
        }
        throw lastError;
    }

    // ── Tool execution ─────────────────────────
    async _executeTool({ name, args }, sessionId) {
        const emailService = require('./emailService');
        console.log(`[AI Bot] 🔧 Executing Tool: ${name}`, args);
        try {
            if (name === 'search_products') {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, description, price, sizes, colors, in_stock')
                    .or(`name.ilike.%${args.query}%,description.ilike.%${args.query}%`)
                    .eq('in_stock', true)
                    .limit(MAX_RESULTS);

                if (error) throw error;
                return data?.length
                    ? data.map(p => ({ id: p.id, name: p.name, price_egp: p.price, sizes: p.sizes, colors: p.colors }))
                    : { message: 'لا يوجد منتجات مطابقة حالياً في المخزون.' };
            }

            if (name === 'check_order_status') {
                const searchPhone = normalizePhone(args.phone_number);
                if (!searchPhone) return { message: 'رقم الهاتف غير صالح.' };

                const { data: users } = await supabase
                    .from('users').select('id').ilike('phone', `%${searchPhone}%`);

                if (users?.length) {
                    const { data: orders, error } = await supabase
                        .from('orders')
                        .select('id, order_number, status, total, created_at')
                        .in('user_id', users.map(u => u.id))
                        .order('created_at', { ascending: false })
                        .limit(MAX_ORDERS);
                    if (error) throw error;
                    if (orders?.length) return orders.map(formatOrder);
                }

                // Fallback: guest orders
                const { data: guest, error: ge } = await supabase
                    .from('orders')
                    .select('id, order_number, status, total, created_at')
                    .ilike('shipping_address->>phone', `%${searchPhone}%`)
                    .order('created_at', { ascending: false })
                    .limit(MAX_ORDERS);
                if (ge) throw ge;
                
                return guest?.length
                    ? guest.map(formatOrder)
                    : { message: 'لم نعثر على طلبات مسجلة بهذا الرقم.' };
            }

            if (name === 'check_inventory') {
                const { data, error } = await supabase
                    .from('products')
                    .select('name, stock, price')
                    .ilike('name', `%${args.query}%`)
                    .limit(3);
                if (error) throw error;
                return data?.length ? data : { message: 'لا يوجد تتوفر معلومات حول هذا المنتج.' };
            }

            if (name === 'request_cancellation') {
                const { order_number, phone_number, reason } = args;
                
                // Save logic
                const { data, error } = await supabase
                   .from('cancellation_requests')
                   .insert([{ order_id: order_number, phone_number: phone_number, reason: reason }])
                   .select().single();
                   
                if (!error) {
                    await emailService.sendCancellationRequestNotification(order_number, phone_number, reason, data.id);
                    return { message: "تم رفع طلب الإلغاء للإدارة بنجاح ليتم الموافقة عليه، وسيتم الرد عليكم." };
                }
                return { message: "حدث خطأ أثناء رفع طلب الإلغاء، يرجى استدعاء الدعم." };
            }

            if (name === 'request_human_agent') {
                if (!sessionId) return { message: "لا تتوفر جلسة صحيحة للتحويل للبشري." };
                const notificationService = require('./notificationService');
                
                // Update session status in DB
                await supabase.from('chat_sessions')
                    .update({ status: 'human_requested' })
                    .eq('session_id', sessionId);
                
                // 1. Trigger REAL Telegram Call (High Priority)
                try {
                    const callText = `عميل يطلب مساعدتك في متجر هَوَسي. السبب: ${args.reason || 'غير محدد'}`;
                    await notificationService.sendTelegramCall(callText);
                } catch (e) { console.error('Telegram Call Warning:', e.message); }

                // 2. Send Telegram Text with session info
                try {
                    const textMsg = `🚨 *طلب دعم بشري جديد!*\n\n📍 الجلسة: \`${sessionId}\`\n❓ السبب: ${args.reason || 'غير محدد'}\n\nيرجى الدخول للوحة التحكم للرد.`;
                    await notificationService.sendTelegramText(textMsg);
                } catch (e) { console.error('Telegram Text Warning:', e.message); }

                // 3. Notify via Email (Fallback/Record)
                try {
                    await emailService.sendHumanAgentRequestNotification(sessionId, args.reason);
                } catch (e) { console.error('Email Notification Warning:', e.message); }
                    
                return { message: "جاري طلب مكالمة هاتفية للإدارة وتحويلك للدعم الفني." };
            }

        } catch (err) {
            console.error('[AI Bot] Tool Error:', err);
            return { error: 'حدث خطأ أثناء جلب البيانات من النظام.' };
        }
        return { error: 'أداة غير معروفة.' };
    }

    // ── AI Summarization ───────────────────────
    async summarizeChat(history = []) {
        if (!history.length) return "";
        try {
            const textHistory = history.map(h => `${h.role}: ${h.parts[0].text}`).join('\n');
            const contents = [{ role: 'user', parts: [{ text: `لخص البيانات التالية للعميل:\n${textHistory}` }] }];
            const config = { systemInstruction: SUMMARIZER_SYSTEM + '\n\nملاحظة: لا تستخدم تاجات التفكير <think>.' };
            const result = await this._generateWithRetry(FORMATTER_MODEL, config, contents);
            return result.text.trim();
        } catch (err) {
            console.error('[AI Bot] Summarization Error:', err);
            return "";
        }
    }

    // ── Main entry ─────────────────────────────
    async handleChat(userMessage, history = [], sessionId = null, summary = null) {
        const instance = this._getInstance();
        console.log(`[AI Bot] 💬 User: ${userMessage}`);

        // 1. تنظيف الهيستوري القديم
        const cleanedHistory = (history || []).map(entry => {
            if (entry.role === 'model') {
                return {
                    ...entry,
                    parts: entry.parts
                        .filter(p => !p.thought) // حذف أجزاء التفكير الداخلي تماماً
                        .map(p => p.text ? { ...p, text: cleanModelText(p.text) } : p)
                        .filter(p => p.text === undefined || p.text.trim().length > 0) // حذف النصوص الفاضية مع ترك الأدوات
                };
            }
            return entry;
        });

        // ════════════════════════════════════════
        //  STEP 1 — Reasoner & Tools (with key retry)
        // ════════════════════════════════════════
        const toolsConfig = { tools: TOOLS, systemInstruction: TOOLS_SYSTEM + '\n\nCRITICAL RULE: DO NOT use <think> tags. Do not show your internal reasoning.' }; 
        
        let promptWithInstructions = userMessage;
        if (cleanedHistory.length === 0) {
            promptWithInstructions = `تعليمات النظام:\n${TOOLS_SYSTEM}\n\nرسالة العميل:\n${userMessage}`;
        }
        
        let currentContents = [...cleanedHistory, { role: 'user', parts: [{ text: promptWithInstructions }] }];
        let result = await this._generateWithRetry(REASONER_MODEL, toolsConfig, currentContents);
        let toolData = null;

        // Tool-call loop
        let iterations = 0;
        while (result.functionCalls?.length && iterations++ < 3) {
            const calls = result.functionCalls;
            const toolResponses = await Promise.all(
                calls.map(async call => {
                    const res = await this._executeTool(call, sessionId);
                    toolData = res; 
                    return {
                        name: call.name,
                        result: res
                    };
                })
            );

            // Append model's functionCall to history
            currentContents.push({ 
                role: 'model', 
                parts: calls.map(c => ({ functionCall: { name: c.name, args: c.args } })) 
            });

            // WORKAROUND FOR GEMMA 500 ERROR: Send tool results as standard user text message
            const toolResultsText = toolResponses.map(tr => `[System Tool Output for ${tr.name}]:\n${JSON.stringify(tr.result)}`).join('\n\n');
            currentContents.push({ role: 'user', parts: [{ text: toolResultsText }] });

            result = await this._generateWithRetry(REASONER_MODEL, toolsConfig, currentContents);
        }

        const formatterConfig = { 
            systemInstruction: FORMAT_SYSTEM + '\n\nCRITICAL RULE: DO NOT use <think> tags. Do not show your internal reasoning. Just output JSON.'
        }; 

        const recentContext = cleanedHistory.slice(-2).map(h => {
            const text = h.parts.find(p => p.text)?.text || '';
            return `${h.role === 'user' ? 'العميل' : 'المساعد'}: ${text}`;
        }).join('\n');
        
        const formatterPrompt = toolData
            ? `${FORMAT_SYSTEM}\n\nسياق المحادثة السابقة:\n${recentContext}\n\nبيانات النظام (للاطلاع الداخلي فقط - ممنوع إظهارها للعميل):\n${JSON.stringify(toolData, null, 2)}\n\nرسالة العميل الحالية: "${userMessage}"\n\nالمطلوب: صغ رداً نهائياً بالعامية المصرية الراقية يتفاعل مع العميل باستخدام المعلومات أعلاه، مع الالتزام التام بصيغة الـ JSON فقط. تذكر: لا تذكر كود JSON أو رموز تقنية في حقل الـ reply.`
            : `${FORMAT_SYSTEM}\n\nسياق المحادثة السابقة:\n${recentContext}\n\nرسالة العميل الحالية: "${userMessage}"\n\nالمطلوب: أجب بأسلوب راقٍ ومباشر مع الالتزام بصيغة الـ JSON فقط.`;

        let finalReply = '';
        let rawText = '';
        try {
            const fResult = await this._generateWithRetry(FORMATTER_MODEL, formatterConfig, [{ role: 'user', parts: [{ text: formatterPrompt }] }]);
            rawText = fResult.text;
            
            // تنظيف الـ JSON
            const cleanedText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            
            const parsed  = JSON.parse(cleanedText);
            finalReply    = parsed.reply || '';
        } catch (e) {
            console.warn('[AI Bot] ⚠️ JSON parse failed. rawText:', rawText);
            console.warn('[AI Bot] ⚠️ Parse error:', e);
            try {
                const fResult = await this._generateWithRetry(FORMATTER_MODEL, formatterConfig, [{ role: 'user', parts: [{ text: formatterPrompt }] }]);
                const raw     = fResult.text;
                const match   = raw.match(/"reply"\s*:\s*"([\s\S]*?)(?<!\\)"/);
                finalReply    = match?.[1] ?? '';
            } catch (_) { }
        }

        if (!finalReply) {
            finalReply = 'أهلاً بك في hwasi. كيف يمكنني مساعدتك اليوم؟';
        }

        finalReply = cleanModelText(finalReply);

        console.log(`[AI Bot] 🤖 Reply: ${finalReply}`);

        // ════════════════════════════════════════
        //  STEP 3 — Clean History Construction
        // ════════════════════════════════════════
        const finalHistoryToReturn = [
            ...cleanedHistory,
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: finalReply }] }
        ];

        return {
            reply:   finalReply,
            history: finalHistoryToReturn,
        };
    }
}

module.exports = new AIChatbotService();
