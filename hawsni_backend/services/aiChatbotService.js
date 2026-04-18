const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require('../config/supabase');

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const REASONER_MODEL  = "gemma-4-31b-it"; 
const FORMATTER_MODEL = "gemma-3-27b-it"; 
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
        }
    ]
}];

// ─────────────────────────────────────────────
//  SYSTEM INSTRUCTIONS
// ─────────────────────────────────────────────

// الموديل الأول: العقل المدبر (يقرر استدعاء الأدوات فقط)
const TOOLS_SYSTEM = `
أنت العقل المدبر لمتجر Hawsni للأزياء الفاخرة. 
مهمتك الوحيدة: تقرر هل تحتاج لاستدعاء أداة أم لا بناءً على طلب العميل.
- إذا احتجت أداة مثل البحث عن منتج أو تتبع طلب، استدعِها فوراً.
- إذا لم تحتج لأي أداة (مثلاً العميل يلقي التحية فقط)، لا تستدعِ شيئاً.
- ردك يجب أن يكون مباشراً وبدون شرح مطول لخطواتك (Chain of Thought).
`.trim();

// الموديل الثاني: الواجهة (يصيغ الرد النهائي كـ JSON)
const FORMAT_SYSTEM = `
أنت مساعد متجر Hawsni للأزياء الفاخرة. 
قواعد صارمة جداً (CRITICAL):
1. يجب أن ترد دائماً بـ JSON object يحتوي مفتاح "reply" فقط.
2. لا تكتب أي شيء خارج كائن الـ JSON. 
3. الرد داخل "reply" يجب أن يكون بالعربية النظيفة، راقياً، مختصراً، ومباشراً.
4. إذا تم توفير بيانات من النظام، اعرضها بوضوح للعميل.
5. لا تفصح أبداً عن بيانات شخصية كاملة للعملاء.

مثال للرد الصحيح:
{"reply": "وعليكم السلام، أهلاً بك في Hawsni. كيف يمكنني مساعدتك اليوم؟"}
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
            .filter(Boolean);

        if (!this.apiKeys.length) {
            console.warn('[AI Bot] ⚠️ No GEMINI_API_KEYs found in .env');
            return;
        }

        console.log(`[AI Bot] ✅ ${this.apiKeys.length} API key(s) loaded for rotation.`);
        this.genAIInstances  = this.apiKeys.map(k => new GoogleGenerativeAI(k));
        this.currentKeyIndex = 0;
    }

    // ── Key rotation ───────────────────────────
    _getInstance() {
        if (!this.genAIInstances?.length) throw new Error('AI not initialized. Check API Keys.');
        const inst = this.genAIInstances[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.genAIInstances.length;
        return inst;
    }

    // ── Model A: Gemma + Tools ─────────────────
    _getToolsModel(instance) {
        return instance.getGenerativeModel({
            model:             REASONER_MODEL,
            systemInstruction: TOOLS_SYSTEM,
            tools:             TOOLS,
        });
    }

    // ── Model B: Gemma + JSON Formatter ────────
    _getFormatterModel(instance) {
        return instance.getGenerativeModel({
            model:             FORMATTER_MODEL,
            systemInstruction: FORMAT_SYSTEM,
            generationConfig:  { responseMimeType: "application/json" },
        });
    }

    // ── Tool execution ─────────────────────────
    async _executeTool({ name, args }) {
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
                    .ilike('shipping_address', `%${searchPhone}%`)
                    .order('created_at', { ascending: false })
                    .limit(MAX_ORDERS);
                if (ge) throw ge;
                
                return guest?.length
                    ? guest.map(formatOrder)
                    : { message: 'لم نعثر على طلبات مسجلة بهذا الرقم.' };
            }
        } catch (err) {
            console.error('[AI Bot] Tool Error:', err);
            return { error: 'حدث خطأ أثناء جلب البيانات من النظام.' };
        }
        return { error: 'أداة غير معروفة.' };
    }

    // ── Main entry ─────────────────────────────
    async handleChat(userMessage, history = []) {
        const instance = this._getInstance();
        console.log(`[AI Bot] 💬 User: ${userMessage}`);

        // 1. تنظيف الهيستوري القديم
        const cleanedHistory = (history || []).map(entry => {
            if (entry.role === 'model') {
                return {
                    ...entry,
                    parts: entry.parts.map(p => p.text ? { ...p, text: cleanModelText(p.text) } : p)
                };
            }
            return entry;
        });

        // ════════════════════════════════════════
        //  STEP 1 — Model A: Reasoner & Tools
        // ════════════════════════════════════════
        const toolsModel = this._getToolsModel(instance);
        const chat = toolsModel.startChat({ history: cleanedHistory });

        let result   = await chat.sendMessage(userMessage);
        let response = result.response;
        let toolData = null;

        // Tool-call loop
        let iterations = 0;
        while (response.functionCalls?.()?.length && iterations++ < 3) {
            const calls = response.functionCalls();
            const toolResponses = await Promise.all(
                calls.map(async call => {
                    const res = await this._executeTool(call);
                    toolData = res; 
                    return {
                        functionResponse: {
                            name:     call.name,
                            response: { result: res },
                        },
                    };
                })
            );

            result   = await chat.sendMessage(toolResponses);
            response = result.response;
        }

        // ════════════════════════════════════════
        //  STEP 2 — Model B: JSON Formatter
        // ════════════════════════════════════════
        const formatterModel = this._getFormatterModel(instance);

        const recentContext = cleanedHistory.slice(-2).map(h => {
            const text = h.parts.find(p => p.text)?.text || '';
            return `${h.role === 'user' ? 'العميل' : 'المساعد'}: ${text}`;
        }).join('\n');
        
        const formatterPrompt = toolData
            ? `سياق المحادثة السابقة:\n${recentContext}\n\nرسالة العميل الحالية: "${userMessage}"\n\nبيانات النظام:\n${JSON.stringify(toolData, null, 2)}\n\nصغ رداً نهائياً بأسلوب يجمع الفخامة والوضوح باللغة العربية.`
            : `سياق المحادثة السابقة:\n${recentContext}\n\nرسالة العميل الحالية: "${userMessage}"\n\nأجب بأسلوب راقٍ ومباشر.`;

        let finalReply = '';
        try {
            const fResult = await formatterModel.generateContent(formatterPrompt);
            let rawText = fResult.response.text();
            
            // تنظيف الـ JSON
            rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            
            const parsed  = JSON.parse(rawText);
            finalReply    = parsed.reply || '';
        } catch (e) {
            console.warn('[AI Bot] ⚠️ JSON parse failed, using regex fallback');
            try {
                const fResult = await formatterModel.generateContent(formatterPrompt);
                const raw     = fResult.response.text();
                const match   = raw.match(/"reply"\s*:\s*"([\s\S]*?)(?<!\\)"/);
                finalReply    = match?.[1] ?? '';
            } catch (_) { }
        }

        if (!finalReply) {
            finalReply = 'أهلاً بك في Hawsni. كيف يمكنني مساعدتك اليوم؟';
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
