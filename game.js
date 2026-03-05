// game.js - 优化版

// --- 1. 图片预加载 (解决首次生成卡顿) ---
const preLoadImages = [
    // 建筑
    'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build4.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build3.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build17.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build18.png',
    'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build13.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build9.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build10.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build15.png',
    'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build7.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build1.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build14.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build11.png',
    'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build5.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build2.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build6.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build16.png',
    // 人物
    'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character1.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character2.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character3.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character4.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character5.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character6.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character7.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character8.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character9.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character10.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character11.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character12.png', 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character13.png'
];
preLoadImages.forEach(src => { new Image().src = src; });


// --- 资源图标全局定义 ---
const RESOURCE_ICONS = {
    treasury: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/food.png',
    people: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/tech.png',
    military: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/army.png',
    culture: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/culture1.png'
};


// --- 数据定义 ---
let resources = { treasury: 50, people: 50, military: 50, culture: 50 }, incomeRates = { treasury: 5, people: 5, military: 5, culture: 5 };

// 添加状态缓存变量
let lastTextState = 'none';  // 'left' | 'right' | 'none'
let lastHighlightDir = null; // 缓存当前高亮方向
let rafId = null;
const RECRUIT_COOLDOWN = 60; // 招募时间间隔
let snowInterval = null; // 新增：用于保存雪花生成器的ID
let highlightTimers = {}; // 新增：用于存储资源高亮动画的计时器
// --- 全局状态变量 ---
let suppressNextClick = false; // 新增：用于阻止放置建筑后的误触点击
let triggeredEvents = {
    prophecy1: false,
    gov1: false,
    prophecy2: false,
    gov2: false,
    prophecy3: false
};

// 建筑定义 (已更新)

// --- 新增：建筑配置表 (16种) ---
const BUILDING_CATALOG = [
    // 消耗 粮食 (Treasury)
    { id: 'b_t_t', name: "农田", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build4.png", cost: {type:'treasury', val:30}, gain: {type:'treasury', val:40} },
    { id: 'b_t_p', name: "义学", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build16.png", cost: {type:'treasury', val:30}, gain: {type:'people', val:50} },
    { id: 'b_t_m', name: "武备库", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build11.png", cost: {type:'treasury', val:30}, gain: {type:'military', val:50} },
    { id: 'b_t_c', name: "大剧院", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build9.png", cost: {type:'treasury', val:30}, gain: {type:'culture', val:50} },
    // 消耗 科技 (People)
    { id: 'b_p_t', name: "水利", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build15.png", cost: {type:'people', val:30}, gain: {type:'treasury', val:50} },
    { id: 'b_p_p', name: "科学院", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build10.png", cost: {type:'people', val:30}, gain: {type:'people', val:40} },
    { id: 'b_p_m', name: "神机营", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build14.png", cost: {type:'people', val:30}, gain: {type:'military', val:50} },
    { id: 'b_p_c', name: "印刷坊", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build2.png", cost: {type:'people', val:30}, gain: {type:'culture', val:50} },
    // 消耗 军事 (Military)
    { id: 'b_m_t', name: "粮仓", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build3.png", cost: {type:'military', val:30}, gain: {type:'treasury', val:50} },
    { id: 'b_m_p', name: "工兵营", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build13.png", cost: {type:'military', val:30}, gain: {type:'people', val:50} },
    { id: 'b_m_m', name: "演武场", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build7.png", cost: {type:'military', val:30}, gain: {type:'military', val:40} },
    { id: 'b_m_c', name: "烽火台", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build1.png", cost: {type:'military', val:30}, gain: {type:'culture', val:50} },
    // 消耗 文化 (Culture)
    { id: 'b_c_t', name: "码头", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build17.png", cost: {type:'culture', val:30}, gain: {type:'treasury', val:50} },
    { id: 'b_c_p', name: "西市集", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build5.png", cost: {type:'culture', val:30}, gain: {type:'people', val:50} },
    { id: 'b_c_m', name: "东市集", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build18.png", cost: {type:'culture', val:30}, gain: {type:'military', val:50} },
    { id: 'b_c_c', name: "游船坊", icon: "https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/build6.png", cost: {type:'culture', val:30}, gain: {type:'culture', val:40} }
];

// 建造相关状态变量
let placedBuildings = []; // 存储已放置建筑信息
let isBuildingMode = false; // 是否处于建造模式
let selectedBuilding = null; // 当前选中的建筑数据

// 政策树
// 政策树 (文本优化与数值平衡版)
const policyTrees = [
    // 剧本一：运河伟业
    [
        { 
            id: "c1", 
            title: "开凿大运河", 
            desc: "江南富庶，中原腹地，若有一河贯通，南粮可北运，国运或可昌隆。然此役浩大，征发民夫百万，恐生民变。工部尚书呈上两策：一为激进施工，二为缓图之。", 
            left: { text: "功在千秋，即刻开工！", effect: { treasury: -10, people: -5, culture: 5 }, nextId: "c2_start" }, 
            right: { text: "百姓方安，缓图之。", effect: { treasury: 5, people: 5 }, nextId: "c2_stop" } 
        },
        { 
            id: "c2_stop", 
            title: "休养生息", 
            desc: "旨意一下，举国欢腾。但南方漕运不通，长安米价飞涨，市井颇有怨言。户部提议开仓放粮，但这会削弱国储。", 
            left: { text: "开仓放粮，平抑米价。", effect: { treasury: -10, people: 10 }, nextId: "c3_stop_good" }, 
            right: { text: "市场之事，官府不宜干预。", effect: { treasury: 5, people: -5 }, nextId: "c3_stop_bad" } 
        },
        { 
            id: "c3_stop_good", 
            title: "盛世安宁", 
            desc: "百姓感念皇恩，虽无大工，但根基稳固，各地传来丰收喜讯。", 
            left: { text: "减税一年，休养生息。", effect: { treasury: -5, people: 10 }, nextId: "c4_end_peace" }, 
            right: { text: "鼓励农桑，屯田养兵。", effect: { treasury: 5, people: 5 }, nextId: "c4_end_peace" } 
        },
        { 
            id: "c3_stop_bad", 
            title: "民怨沸腾", 
            desc: "米价失控，饥民开始哄抢粮店，地方官员请求增兵弹压。", 
            left: { text: "出兵弹压，以儆效尤。", effect: { military: 5, people: -10 }, nextId: "c4_end_chaos" }, 
            right: { text: "下诏罪己，开仓赈济。", effect: { treasury: -10, people: 10 }, nextId: "c4_end_peace" } 
        },
        { 
            id: "c4_end_peace", 
            title: "国泰民安", 
            desc: "国家虽无大工，但百姓富足，四方来朝。", 
            left: { text: "...", effect: { culture: 10 }, nextId: "end" }, 
            right: { text: "...", effect: { culture: 10 }, nextId: "end" } 
        },
        { 
            id: "c4_end_chaos", 
            title: "动荡不安", 
            desc: "动乱虽平，却元气大伤，想要恢复，怕是需要一番功夫了。", 
            left: { text: "...", effect: { military: 5 }, nextId: "end" }, 
            right: { text: "...", effect: { military: 5 }, nextId: "end" } 
        },

        // 开工路线
        { 
            id: "c2_start", 
            title: "工程浩大", 
            desc: "征发令下，中原大地满目疮痍，役夫死者相枕。河道初具雏形，然朝廷派来的督查使臣胃口极大，暗示要好处。", 
            left: { text: "坦然面对，接受督查", effect: { treasury: -5, people: 5 }, nextId: "c3_check" }, 
            right: { text: "上下打点，遮掩亏损", effect: { treasury: -10, people: -5 }, nextId: "c3_check" } 
        },
        // 【随机判定】：贪腐督查
        // 左(坦白) = 押大；右(打点) = 押小
        { 
            id: "c3_check", title: "督查危机", desc: "督查使臣在工地上横挑鼻子竖挑眼。若被他查出亏空，恐有大祸；若能瞒天过海，便是泼天富贵。", 
            left: { text: "据实相告，赌他公正", effect: {}, special: "gamble", winNext: "c3_check_win", loseNext: "c3_check_lose" }, 
            right: { text: "献上巨额贿赂", effect: {}, special: "gamble", winNext: "c3_check_win", loseNext: "c3_check_lose" } 
        },
        { id: "c3_check_win", title: "有惊无险", desc: "使臣虽然刁钻，但看你应对得体（或是钱到位了），并未深究。工程得以继续。", left: { text: "继续施工", effect: { treasury: -5 }, nextId: "c4_build_soft" }, right: { text: "继续施工", effect: { treasury: -5 }, nextId: "c4_build_soft" } },
        { id: "c3_check_lose", title: "东窗事发", desc: "使臣大怒，上奏朝廷。你被革职查办，工程被迫中断，之前的投入打了水漂。", left: { text: "无奈", effect: { treasury: -15, people: -5 }, nextId: "c4_build_force" }, right: { text: "无奈", effect: { treasury: -15, people: -5 }, nextId: "c4_build_force" } },

        { 
            id: "c4_build_soft", 
            title: "仁政工程", 
            desc: "虽耗资巨大，但民心可用，两岸百姓箪食壶浆以迎王师。", 
            left: { text: "...", effect: { people: 15, culture: 10 }, nextId: "c5_end_good" }, 
            right: { text: "...", effect: { people: 15, culture: 10 }, nextId: "c5_end_good" } 
        },
        { 
            id: "c4_build_force", 
            title: "暴政工程", 
            desc: "运河通航，粮船蔽日。然两岸百姓家家戴孝，哭声震天。", 
            left: { text: "...", effect: { treasury: 20, people: -15 }, nextId: "c5_end_bad" }, 
            right: { text: "...", effect: { treasury: 20, people: -15 }, nextId: "c5_end_bad" } 
        },
        { 
            id: "c5_end_good", 
            title: "运河清波", 
            desc: "运河两岸商贸繁荣，大唐国运如日中天。", 
            left: { text: "好", effect: { culture: 15 }, nextId: "end" }, 
            right: { text: "好", effect: { culture: 15 }, nextId: "end" } 
        },
        { 
            id: "c5_end_bad", 
            title: "血色运河", 
            desc: "功业已成，然怨气冲天，为日后埋下祸根。", 
            left: { text: "唉", effect: { people: -10 }, nextId: "end" }, 
            right: { text: "唉", effect: { people: -10 }, nextId: "end" } 
        }
    ],

    // 剧本二：边关风云
    [
        { 
            id: "b1", 
            title: "突厥南下", 
            desc: "北方突厥集结二十万铁骑，意图染指中原。边关告急文书一日三至。朝中分为两派，一派主和，一派主战。", 
            left: { text: "纳贡称臣，换取时间。", effect: { treasury: -15, people: -5, culture: -5 }, nextId: "b2_peace" }, 
            right: { text: "御驾亲征，鼓舞士气！", effect: { treasury: -10, military: 10 }, nextId: "b2_war" } 
        },
        { 
            id: "b2_peace", 
            title: "屈辱求和", 
            desc: "使者带去金帛万匹，换得突厥退兵。然对方傲慢无礼，邀你赴营中“叙旧”，恐是鸿门宴。", 
            left: { text: "带重兵护卫前往", effect: { military: 5 }, nextId: "b3_meeting" }, 
            right: { text: "单刀赴会，显大国气度", effect: { culture: 5 }, nextId: "b3_meeting" } 
        },
        // 【随机判定】：鸿门宴
        // 左(重兵) = 押大；右(单刀) = 押小
        { 
            id: "b3_meeting", title: "鸿门宴", desc: "突厥大帐内刀斧手林立。可汗目光闪烁，不知是真心和谈，还是诈降。", 
            left: { text: "严加戒备", effect: {}, special: "gamble", winNext: "b3_meeting_win", loseNext: "b3_meeting_lose" }, 
            right: { text: "推杯换盏，以诚相待", effect: {}, special: "gamble", winNext: "b3_meeting_win", loseNext: "b3_meeting_lose" } 
        },
        { id: "b3_meeting_win", title: "不辱使命", desc: "你的气度（或武力）震慑了可汗，双方歃血为盟，边境暂得安宁。", left: { text: "回师", effect: { people: 10 }, nextId: "b4_end_win" }, right: { text: "回师", effect: { people: 10 }, nextId: "b4_end_win" } },
        { id: "b3_meeting_lose", title: "身陷囹圄", desc: "突厥翻脸，将你扣押。朝廷为了赎你，不得不割让三州。", left: { text: "奇耻大辱", effect: { people: -15, culture: -10 }, nextId: "b4_end_shame" }, right: { text: "奇耻大辱", effect: { people: -15, culture: -10 }, nextId: "b4_end_shame" } },

        { id: "b4_end_shame", title: "偏安一隅", desc: "大唐虽存，已无天可汗之威，苟延残喘。", left: { text: "...", effect: { culture: -5 }, nextId: "end" }, right: { text: "...", effect: { culture: -5 }, nextId: "end" } },
        { id: "b4_end_win", title: "大捷", desc: "突厥远遁，边关十年无事。", left: { text: "...", effect: { military: 15 }, nextId: "end" }, right: { text: "...", effect: { military: 15 }, nextId: "end" } },

        // 主战路线
        { 
            id: "b2_war", 
            title: "战局胶着", 
            desc: "两军对垒，互有胜负。有将领建议趁夜火攻敌营，但这有违仁义，且风向难测。", 
            left: { text: "兵不厌诈，批准火攻！", effect: { military: 10, people: -5 }, nextId: "b3_war_fire" }, 
            right: { text: "堂堂正正，正面决战！", effect: { military: -5, treasury: -10 }, nextId: "b3_war_charge" } 
        },
        { 
            id: "b3_war_fire", 
            title: "烈火焚原", 
            desc: "一把大火，突厥大营化为灰烬，敌军溃败。但同时也烧毁了边境草场，风沙骤起。", 
            left: { text: "胜者为王，无需多虑。", effect: { military: 10, culture: -5 }, nextId: "b4_end_fire" }, 
            right: { text: "于心不忍，安抚灾民。", effect: { treasury: -5, people: 5 }, nextId: "b4_end_fire" } 
        },
        { 
            id: "b3_war_charge", 
            title: "惨烈决战", 
            desc: "正面交锋，杀敌一千自损八百，双方尸横遍野。", 
            left: { text: "厚葬将士，抚恤家属。", effect: { treasury: -10, people: 10 }, nextId: "b4_end_blood" }, 
            right: { text: "整顿军纪，再战！", effect: { military: 5 }, nextId: "b4_end_blood" } 
        },
        { 
            id: "b4_end_fire", 
            title: "焦土之战", 
            desc: "虽胜犹耻，百年不敢南下牧马。", 
            left: { text: "...", effect: { military: 10 }, nextId: "end" }, 
            right: { text: "...", effect: { military: 10 }, nextId: "end" } 
        },
        { 
            id: "b4_end_blood", 
            title: "铁血长歌", 
            desc: "将士们用鲜血筑起了新的长城。", 
            left: { text: "...", effect: { people: 10 }, nextId: "end" }, 
            right: { text: "...", effect: { people: 10 }, nextId: "end" } 
        }
    ],

    // 剧本三：佛光普照
    [
        { 
            id: "f1", 
            title: "佛法大兴", 
            desc: "各地寺院经济膨胀，良田皆归佛门，免税特权令国库日渐枯竭，然百姓信佛者众。", 
            left: { text: "尊崇佛教，为国祈福。", effect: { treasury: -10, culture: 15 }, nextId: "f2_build" }, 
            right: { text: "下令灭佛，扩充国库！", effect: { treasury: 20, culture: -10 }, nextId: "f2_kill" } 
        },
        { 
            id: "f2_build", 
            title: "举国狂热", 
            desc: "寺院林立，钟鼓齐鸣。然农田荒芜，劳动力流失。一日，有僧人称见到佛光，乃是祥瑞。", 
            left: { text: "大肆宣扬，以此安民", effect: { culture: 10, people: 5 }, nextId: "f3_miracle" }, 
            right: { text: "严查真伪，防妖言惑众", effect: { people: -5, treasury: 5 }, nextId: "f3_miracle" } 
        },
        // 【随机判定】：佛光真伪
        // 左(宣扬) = 押大；右(严查) = 押小
        { 
            id: "f3_miracle", title: "佛光之谜", desc: "若佛光为真，则民心大振；若为假，则威信扫地。", 
            left: { text: "相信是祥瑞", effect: {}, special: "gamble", winNext: "f3_miracle_win", loseNext: "f3_miracle_lose" }, 
            right: { text: "质疑其真伪", effect: {}, special: "gamble", winNext: "f3_miracle_win", loseNext: "f3_miracle_lose" } 
        },
        { id: "f3_miracle_win", title: "天降祥瑞", desc: "万民跪拜，香火鼎盛，国库虽空，但百姓精神富足。", left: { text: "善哉", effect: { culture: 20, people: 10 }, nextId: "f4_end_holy" }, right: { text: "善哉", effect: { culture: 20, people: 10 }, nextId: "f4_end_holy" } },
        { id: "f3_miracle_lose", title: "骗局败露", desc: "所谓佛光竟是僧人点燃的磷火！民众大失所望，信仰崩塌。", left: { text: "严惩僧人", effect: { people: -10, culture: -10 }, nextId: "f4_end_poor" }, right: { text: "掩盖真相", effect: { treasury: -10 }, nextId: "f4_end_poor" } },

        { id: "f4_end_holy", title: "西方极乐", desc: "大唐成为佛国圣地，万国来朝。", left: { text: "...", effect: { culture: 10 }, nextId: "end" }, right: { text: "...", effect: { culture: 10 }, nextId: "end" } },
        { id: "f4_end_poor", title: "寺庙富甲", desc: "百姓食不果腹，僧侣却肥头大耳。", left: { text: "...", effect: { treasury: -10 }, nextId: "end" }, right: { text: "...", effect: { treasury: -10 }, nextId: "end" } },

        { 
            id: "f2_kill", 
            title: "会昌法难", 
            desc: "拆毁寺院，勒令僧尼还俗，没收寺产。举国哗然，僧侣聚集宫门抗议。", 
            left: { text: "强力驱散，严惩不贷。", effect: { people: -10, military: 5 }, nextId: "f3_kill_hard" }, 
            right: { text: "安抚劝导，发放遣散费。", effect: { treasury: -5, people: 5 }, nextId: "f3_kill_soft" } 
        },
        { 
            id: "f3_kill_hard", 
            title: "血染袈裟", 
            desc: "流血冲突在所难免，背负了骂名，但国库确实充盈了。", 
            left: { text: "为了社稷，值得。", effect: { treasury: 20, culture: -10 }, nextId: "f4_end_rich" }, 
            right: { text: "残忍。", effect: { treasury: 10 }, nextId: "f4_end_rich" } 
        },
        { 
            id: "f3_kill_soft", 
            title: "还俗为民", 
            desc: "增加了劳动力，寺院田产分给百姓，皆大欢喜。", 
            left: { text: "很好。", effect: { people: 10, treasury: 10 }, nextId: "f4_end_live" }, 
            right: { text: "不错。", effect: { people: 5 }, nextId: "f4_end_live" } 
        },
        { 
            id: "f4_end_rich", 
            title: "富国强兵", 
            desc: "国库充盈，军备精良，但暴乱的种子却埋进了人们心中。", 
            left: { text: "...", effect: { treasury: 10 }, nextId: "end" }, 
            right: { text: "...", effect: { treasury: 10 }, nextId: "end" } 
        },
        { 
            id: "f4_end_live", 
            title: "耕读传家", 
            desc: "佛寺变成了学堂，大唐迎来了新的生机。", 
            left: { text: "...", effect: { people: 15 }, nextId: "end" }, 
            right: { text: "...", effect: { people: 15 }, nextId: "end" } 
        }
    ]
];

// 人物剧本 (完整版：2精英 + 3底层)
const characterStories = [
    // --- 剧本一：长安·灯火阑珊处 (精英·含科举/党争检定) ---
{
    name: "长安·灯火阑珊处",
    list: [
        { id: "a1", title: "上元之夜", desc: "长安灯火如昼，你站在人群中，忽然瞥见巷口那盏孤灯下，有个背影像极了当年那个她。你心跳加速，周围喧嚣仿佛消失。", left: { text: "不顾一切追上去",  nextId: "a2_chase" }, right: { text: "停下脚步，凝望",  nextId: "a2_stay" } },
        
        // 追忆分支
        { id: "a2_chase", title: "误入深巷", desc: "你慌不择路追进深巷，却发现那是几个泼皮无赖正在围堵一辆马车。那背影并非她，但你已无法抽身。", left: { text: "挺身而出，喝止恶行",  nextId: "a3_hero" }, right: { text: "大声呼救，引来武侯",  nextId: "a3_smart" } },
        { id: "a3_hero", title: "侠义之举", desc: "你虽手无寸铁，却有一腔热血。一番搏斗，你虽挂彩，却成功惊退了泼皮。马车帘子掀开，竟是当朝宰相千金。", left: { text: "淡然处之，不求回报",  nextId: "a4_official" }, right: { text: "趁机结交，以此邀功",  nextId: "a4_official" } },
        { id: "a3_smart", title: "智退无赖", desc: "你的计策奏效，巡街武侯及时赶到。马车主人感激你的机智，递给你一块令牌。", left: { text: "收下令牌，深藏功名",  nextId: "a4_official" }, right: { text: "询问能否赏些银两",  nextId: "a4_rich" } },

        // 驻足分支
        { id: "a2_stay", title: "灯火阑珊", desc: "你痴痴地望着那背影消失在灯火深处。转身欲走，却撞到了一位老者，他手中的书卷散落一地。", left: { text: "道歉并帮忙拾起",  nextId: "a3_help" }, right: { text: "匆匆道歉离去",  nextId: "a3_leave" } },
        { id: "a3_help", title: "萍水相逢", desc: "老者见你举止儒雅，谈吐不凡，便邀你共饮。原来他是国子监祭酒。", left: { text: "虚心请教，秉烛夜谈",  nextId: "a4_exam" }, right: { text: "只想以此换取荐书",  nextId: "a4_official" } },
        { id: "a3_leave", title: "擦肩而过", desc: "你错失了机缘，只能回到那个拥挤的赁屋，继续苦读。", left: { text: "埋头苦读",  nextId: "a4_exam" }, right: { text: "这书读得真累",  nextId: "a4_rich" } },

        // --- 分支路线 ---
        { id: "a4_official", title: "初入仕途", desc: "在贵人的帮助下，你获得了入仕的捷径。朝堂之上，风云变幻，一步踏错，便是万丈深渊。", left: { text: "清廉正直，以此自保",  nextId: "a5_court" }, right: { text: "结党营私，步步高升",  nextId: "a5_court" } },
        { id: "a4_rich", title: "商海浮沉", desc: "你凭借机灵劲儿，在商海中赚了第一桶金。", left: { text: "富甲一方",  nextId: "a5_end_rich" }, right: { text: "富甲一方",  nextId: "a5_end_rich" } },

        // 【核心检定1】：科举殿试
        // 设定：左(豪放) = 押大；右(婉约) = 押小
        { 
            id: "a4_exam", title: "御笔钦点", desc: "金殿之上，皇帝亲自出题。你凝神静气，笔走龙蛇。是做豪放语震惊四座，还是做婉约词以求稳妥？", 
            left: { text: "豪放派：不破楼兰终不还", effect: {}, special: "gamble", winNext: "a_exam_win", loseNext: "a_exam_lose" }, 
            right: { text: "婉约派：忍把浮名，换了浅斟低唱", effect: {}, special: "gamble", winNext: "a_exam_win", loseNext: "a_exam_lose" } 
        },
        { id: "a_exam_win", title: "金榜题名", desc: "皇帝龙颜大悦，钦点你为状元！文章千古事，得失寸心知。你的名字，响彻长安。", left: { text: "谢主隆恩",  nextId: "a6_end_elite" }, right: { text: "谢主隆恩",  nextId: "a6_end_elite" } },
        { id: "a_exam_lose", title: "名落孙山", desc: "皇帝眉头紧锁，将你的卷子扔在一旁。才华横溢却怀才不遇，你黯然离开了长安。", left: { text: "回乡教书",  nextId: "a5_end_teacher" }, right: { text: "回乡教书",  nextId: "a5_end_teacher" } },

        // 【核心检定2】：朝堂党争
        // 设定：左(改革) = 押大；右(中立) = 押小
        { 
            id: "a5_court", title: "党争漩涡", desc: "朝中两党相争，你已身处漩涡中心。一边是权倾朝野的宰相，一边是锐意改革的少壮派。", 
            left: { text: "站队改革派，富贵险中求", effect: {}, special: "gamble", winNext: "a_court_win", loseNext: "a_court_lose" }, 
            right: { text: "明哲保身，谁也不惹", effect: {}, special: "gamble", winNext: "a_court_win", loseNext: "a_court_lose" } 
        },
        { id: "a_court_win", title: "权倾朝野", desc: "你赌对了！新党得势，你一路青云直上，拜相封侯。", left: { text: "权柄在手",  nextId: "a6_end_elite" }, right: { text: "权柄在手",  nextId: "a6_end_elite" } },
        { id: "a_court_lose", title: "贬谪岭南", desc: "站错了队，被打入大牢，发配岭南。此去岭南八千里，何处是归程？", left: { text: "凄凉上路",  nextId: "a6_end_exile" }, right: { text: "凄凉上路",  nextId: "a6_end_exile" } },

        // --- 结局节点 ---
        { id: "a5_end_teacher", title: "乡间夫子", desc: "你开馆授徒，教书育人。虽然仕途断绝，但你培养出的学生，或许将来能实现你的梦想。", left: { text: "结局",  nextId: "end" ,reward: { type: 'culture', tier: 'blue' }}, right: { text: "结局",  nextId: "end" ,reward: { type: 'culture', tier: 'blue' }} },
        { id: "a5_end_rich", title: "长安首富", desc: "你利用人脉经商，富甲一方。每当夜深人静，你总会想起那个上元节的夜晚，后悔没有追上去。", left: { text: "结局",  nextId: "end",reward: { type: 'merchant', tier: 'purple' } }, right: { text: "结局",  nextId: "end" } ,reward: { type: 'merchant', tier: 'purple' }},

        { id: "a6_end_elite", title: "国之栋梁", desc: "你站在大明宫的最高处，俯瞰着这万家灯火。当年那个在寒风中苦读的少年，终于走到了权力的巅峰。只是，那个身影，再也找不回了。", left: { text: "结局",  nextId: "end" ,reward: { type: 'culture', tier: 'gold' }}, right: { text: "结局",  nextId: "end" } ,reward: { type: 'culture', tier: 'gold' }},
        { id: "a6_end_exile", title: "天涯孤客", desc: "岭南瘴气弥漫，你病骨支离。回望长安，那是回不去的梦。你提笔写下一首绝句，泪洒蛮荒。", left: { text: "结局",  nextId: "end" ,reward: { type: 'culture', tier: 'common' } }, right: { text: "结局",  nextId: "end" ,reward: { type: 'culture', tier: 'common' } } }
    ]
},

// --- 剧本二：凉州·大漠孤烟直 (精英·含随机检定) ---
{
    name: "凉州·大漠孤烟直",
    list: [
        { id: "b1", title: "征兵令", desc: "边关告急，官差的马蹄声踏破了小村的宁静。你的名字，赫然在列。你是家中独子，老母卧病在床，拉着你的衣角哭泣。", left: { text: "替父从军，保家卫国",  nextId: "b2_army" }, right: { text: "贿赂官差，试图逃脱",  nextId: "b2_escape" } },
        
        // --- 从军路线 ---
        { id: "b2_army", title: "边关冷月", desc: "军旅生涯苦寒。一次夜间巡逻，身边的战友被冷箭射倒，生死未卜，敌军的弯刀在月光下闪着寒光。", left: { text: "冒死背回战友",  nextId: "b3_save" }, right: { text: "含泪冲锋，杀敌报仇",  nextId: "b3_charge" } },
        { id: "b3_save", title: "生死兄弟", desc: "战友活了下来，他感激涕零，原来他是将军的亲兵。战后，你们面临新的选择。", left: { text: "退伍回乡，侍奉老母",  nextId: "b4_farmer" }, right: { text: "留在军营，建功立业",  nextId: "b4_soldier" } },
        { id: "b3_charge", title: "杀敌立功", desc: "你的一腔怒火化为战力，斩首三级，被将军赏识提拔。", left: { text: "继续奋斗，争取封侯",  nextId: "b4_soldier" }, right: { text: "见好就收，申请调防",  nextId: "b4_farmer" } },
        
        // --- 逃跑路线 ---
        { id: "b2_escape", title: "流民之路", desc: "你散尽家财，却在途中遭遇流匪。钱财被劫，你也身无分文，流落荒野。", left: { text: "落草为寇，求生要紧",  nextId: "b3_bandit" }, right: { text: "进城乞讨，等待时机",  nextId: "b3_beg" } },
        { id: "b3_bandit", title: "山寨入伙", desc: "你凭着一股狠劲成了二当家，打家劫舍，大口吃肉。但官军的围剿越来越紧。", left: { text: "接受招安，洗白身份", nextId: "b4_soldier" }, right: { text: "继续落草，逍遥法外",  nextId: "b4_bandit" } },
        { id: "b3_beg", title: "遇见恩人", desc: "一位路过的行商见你骨骼惊奇，不像乞儿，收留了你。", left: { text: "报恩，做他的护院",  nextId: "b4_farmer" }, right: { text: "偷学经商之道",  nextId: "b5_end_merchant" } },

        // --- 分支节点 ---
        { id: "b4_farmer", title: "归园田居", desc: "战火平息，你回到了故乡。老母已过世，坟头长满了荒草。你跪在坟前，痛哭流涕。", left: { text: "继承老屋，耕种为生",  nextId: "b5_end_farmer" }, right: { text: "守墓三年，了此残生",  nextId: "b5_end_farmer" } },

        // 士兵线检定：决战时刻
        // 设定：左(死战) = 押大；右(迂回) = 押小
        { 
            id: "b4_soldier", title: "决战时刻", desc: "烽火连天，你也成了百夫长。今夜突厥大举进攻，你必须做出抉择。生死由命，富贵在天。", 
            left: { text: "身先士卒，死战不退！", effect: {}, special: "gamble", winNext: "b_soldier_win", loseNext: "b_soldier_lose" }, 
            right: { text: "迂回包抄，险中求胜", effect: {}, special: "gamble", winNext: "b_soldier_win", loseNext: "b_soldier_lose" } 
        },
        { id: "b_soldier_win", title: "大捷", desc: "你的决断扭转了战局！敌军溃败，你浑身浴血，如战神降临。史书工笔，将留下你的名字。", left: { text: "封狼居胥",  nextId: "b6_end_general" }, right: { text: "封狼居胥",  nextId: "b6_end_general" } },
        { id: "b_soldier_lose", title: "马革裹尸", desc: "乱箭穿心。你倒在血泊中，望着故乡的方向，意识逐渐模糊。这辈子，回不去了。", left: { text: "...",  nextId: "b6_end_martyr" }, right: { text: "...",  nextId: "b6_end_martyr" } },

        // 土匪线检定：官军围剿
        // 设定：左(突围) = 押大；右(投降) = 押小
        { 
            id: "b4_bandit", title: "四面楚歌", desc: "官军烧毁了山寨，烟雾呛鼻。大哥已死，你被逼到了悬崖边。前有追兵，后无退路。", 
            left: { text: "杀出一条血路！", effect: {}, special: "gamble", winNext: "b_bandit_win", loseNext: "b_bandit_lose" }, 
            right: { text: "下马受降，祈求宽恕", effect: {}, special: "gamble", winNext: "b_bandit_win", loseNext: "b_bandit_lose" } 
        },
        { id: "b_bandit_win", title: "逍遥法外", desc: "你滚下了悬崖，虽断了腿，但保住了命。从此江湖上多了一个独腿游侠的传说。", left: { text: "浪迹天涯",  nextId: "b6_end_bandit" }, right: { text: "浪迹天涯",  nextId: "b6_end_bandit" } },
        { id: "b_bandit_lose", title: "悬赏令", desc: "你被生擒，游街示众。百姓向你扔着烂菜叶。刑场上，你仰天长啸，引颈受戮。", left: { text: "二十年后...",  nextId: "b6_end_dead" }, right: { text: "二十年后...",  nextId: "b6_end_dead" } },

        // --- 结局节点 ---
        { id: "b5_end_farmer", title: "田园将芜", desc: "你在老屋旁种下了一棵柳树。春天来了，柳絮纷飞。你想着，这日子虽苦，但终究是太平了。", left: { text: "结局",  nextId: "end",reward: { type: 'military', tier: 'common' } }, right: { text: "结局",  nextId: "end" ,reward: { type: 'military', tier: 'common' }} },
        { id: "b5_end_merchant", title: "商贾之路", desc: "你凭着机灵劲儿，成了行商的大掌柜。虽然再没摸过刀，但商路上的尔虞我诈，比战场更凶险。", left: { text: "结局",  nextId: "end" ,reward: { type: 'merchant', tier: 'purple' }}, right: { text: "结局",  nextId: "end" ,reward: { type: 'merchant', tier: 'purple' }} },
        
        { id: "b6_end_general", title: "一代名将", desc: "你卸下战甲，满身伤疤。朝廷赐下的牌坊立在村口，但你只想回到那个上元节的夜晚，吃一碗母亲做的炊饼。", left: { text: "结局",  nextId: "end",reward: { type: 'military', tier: 'gold' } }, right: { text: "结局",  nextId: "end",reward: { type: 'military', tier: 'gold' } } },
        { id: "b6_end_martyr", title: "边疆枯骨", desc: "没人知道你的名字。只有那漫天的黄沙，掩埋了你的忠魂。大唐的盛世，是由无数像你这样的枯骨堆成的。", left: { text: "结局",  nextId: "end",reward: { type: 'military', tier: 'blue' } }, right: { text: "结局",  nextId: "end",reward: { type: 'military', tier: 'blue' } } },
        { id: "b6_end_bandit", title: "江湖浪子", desc: "你独腿坐在酒馆角落，听人说书人讲那凉州大战的故事。你笑了笑，喝干了碗里的劣酒。", left: { text: "结局",  nextId: "end" ,reward: { type: 'military', tier: 'purple' }}, right: { text: "结局",  nextId: "end" ,reward: { type: 'military', tier: 'purple' }} },
        { id: "b6_end_dead", title: "悬首示众", desc: "你的人头挂在城门上，风吹日晒。路过的诗人写了一首绝句，感叹乱世浮萍。", left: { text: "结局",  nextId: "end",reward: { type: 'military', tier: 'blue' } }, right: { text: "结局",  nextId: "end" ,reward: { type: 'military', tier: 'blue' }} }
    ]
},

// --- 剧本三：市井·贩夫走卒 (底层) ---
{
    name: "市井·贩夫走卒",
    list: [
        { id: "c1", title: "继承摊位", desc: "父亲去世，留下了一个卖炊饼的小摊位。天还没亮，你就得起来揉面，手被冻得通红。", left: { text: "勤劳经营，用心做饼",  nextId: "c2_work" }, right: { text: "想做大生意，这摊位太小",  nextId: "c2_risk" } },
        { id: "c2_work", title: "街坊邻居", desc: "你的炊饼皮薄馅大，渐渐在西市有了名气。有个酒楼的掌柜想让你供货。", left: { text: "薄利多销，稳扎稳打",  nextId: "c3_stable" }, right: { text: "趁机涨价，赚一笔再说",  nextId: "c3_rich" } },
        { id: "c2_risk", title: "借贷进货", desc: "你借高利贷进了一批丝绸倒卖，结果路上遇匪，丝绸被劫。债主上门逼债。", left: { text: "去码头做苦力还债",  nextId: "c3_fail" }, right: { text: "去赌坊搏一把", effect: { merchant: -1 }, nextId: "c3_gamble" } },
        
        { id: "c3_stable", title: "小本生意", desc: "日子过得紧巴巴，但也安稳。到了适婚年龄，媒婆给你说了门亲事。", left: { text: "娶个贤惠媳妇，搭伙过日子",  nextId: "c4_family" }, right: { text: "攒钱不娶，想再拼一把",  nextId: "c4_save" } },
        { id: "c3_rich", title: "西市老板", desc: "你赚了第一桶金，盘下了一家店面。生意火爆，却也招来了同行嫉妒。", left: { text: "低调做人，和气生财",  nextId: "c4_big_boss" }, right: { text: "花钱打点官府，找靠山",  nextId: "c4_big_boss" } },
        { id: "c3_fail", title: "卖身还债", desc: "你到大户人家做家丁，受尽了白眼。但这家的少爷似乎很欣赏你的机灵。", left: { text: "努力干活，争取提拔",  nextId: "c4_servant" }, right: { text: "偷懒耍滑，得过且过",  nextId: "c4_servant" } },
        
        // 特殊赌博节点
        { 
            id: "c3_gamble", title: "孤注一掷", desc: "你押上了全部身家，颤抖的手将仅剩的银两推向赌桌。赌客们屏住呼吸，盯着庄家的手。", 
            left: { text: "押大！", effect: {}, special: "gamble", winNext: "c3_gamble_win", loseNext: "c3_gamble_lose" }, 
            right: { text: "押小！", effect: {}, special: "gamble", winNext: "c3_gamble_win", loseNext: "c3_gamble_lose" } 
        },
        { id: "c3_gamble_win", title: "时来运转", desc: "周围爆发出一阵惊呼。你紧紧攥着赢来的银两，不敢相信这是真的。", left: { text: "见好就收，回家还债",  nextId: "c4_save" }, right: { text: "再赌一把，想赢更多",  nextId: "c3_rich" } },
        { id: "c3_gamble_lose", title: "一无所有", desc: "天旋地转，你瘫软在椅子上。一切都完了。", left: { text: "被赌坊打手扔出门",  nextId: "c4_servant" }, right: { text: "想寻短见",  nextId: "c4_servant" } },

        { id: "c4_family", title: "娶妻生子", desc: "媳妇给你生了个大胖小子。家里开销大了，但也有了盼头。", left: { text: "教导读书，改换门庭",  nextId: "c5_kid_study" }, right: { text: "传授做饼手艺，子承父业",  nextId: "c5_kid_work" } },
        { id: "c4_save", title: "攒钱不娶", desc: "你攒了一笔钱，晚年虽无子嗣，但也无忧。", left: { text: "回乡买几亩地养老",  nextId: "c5_end_normal" }, right: { text: "继续摆摊，直到干不动",  nextId: "c5_end_normal" } },
        { id: "c4_big_boss", title: "富甲一方", desc: "你成了西市有名的富商，还捐了个散官。", left: { text: "结交权贵，洗白身份",  nextId: "c5_end_rich" }, right: { text: "低调做人，闷声发财",  nextId: "c5_end_rich" } },
        { id: "c4_servant", title: "家丁生涯", desc: "你在府里干了十年。少爷要进京赶考，想带个书童随行。", left: { text: "争取名额，随行伺候",  nextId: "c5_servant_good" }, right: { text: "留在府里，看家护院",  nextId: "c5_servant_bad" } },
        
        { id: "c5_kid_study", title: "金榜题名", desc: "儿子争气，考中了进士。你成了老太爷，从此不用再看人脸色。", left: { text: "光宗耀祖",  nextId: "c6_end_pride" }, right: { text: "光宗耀祖",  nextId: "c6_end_pride" } },
        { id: "c5_kid_work", title: "子承父业", desc: "生意更红火，开了三家分号。你老了，干不动了，把摊子交给了儿子。", left: { text: "含饴弄孙",  nextId: "c5_end_normal" }, right: { text: "含饴弄孙",  nextId: "c5_end_normal" } },
        { id: "c5_servant_good", title: "京城见闻", desc: "少爷高中，你也跟着沾光。赏了你一笔钱，放你回家了。", left: { text: "回乡开个小店",  nextId: "c6_end_small_shop" }, right: { text: "告老还乡",  nextId: "c5_end_normal" } },
        { id: "c5_servant_bad", title: "流落街头", desc: "主家败落，你被赶出门，无家可归。", left: { text: "乞讨为生",  nextId: "c6_end_beggar" }, right: { text: "乞讨为生",  nextId: "c6_end_beggar" } },
        
        { id: "c6_end_pride", title: "光宗耀祖", desc: "你站在朱红大门前。回首往事，那个在寒风中揉面的少年，终于走出了命运的泥潭。", left: { text: "...",  nextId: "end" ,reward: { type: 'merchant', tier: 'purple' }}, right: { text: "...",  nextId: "end" ,reward: { type: 'merchant', tier: 'purple' }} },
        { id: "c6_end_small_shop", title: "小店主", desc: "你守着自己的小店，看着街上来来往往的人群，心中满是踏实。", left: { text: "...",  nextId: "end" ,reward: { type: 'merchant', tier: 'blue' }}, right: { text: "...",  nextId: "end",reward: { type: 'merchant', tier: 'blue' } } },
        { id: "c6_end_beggar", title: "乞丐", desc: "你蜷缩在街角，手里捧着半个馊馒头。大雪落下，盖住了你冰冷的身体，再也无人问津。", left: { text: "...",  nextId: "end",reward: { type: 'people', tier: 'common' } }, right: { text: "...",  nextId: "end",reward: { type: 'people', tier: 'common' } } },
        { id: "c5_end_normal", title: "市井小民", desc: "这一生平淡如水，有苦有甜。临终前，儿孙绕膝，你也算死而无憾。", left: { text: "...",  nextId: "end" ,reward: { type: 'merchant', tier: 'common' }}, right: { text: "...",  nextId: "end",reward: { type: 'merchant', tier: 'common' } } },
        { id: "c5_end_rich", title: "富甲一方", desc: "你成了长安城里有头有脸的人物，金山银山，却买不回逝去的青春。", left: { text: "...",  nextId: "end" ,reward: { type: 'merchant', tier: 'purple' }}, right: { text: "...",  nextId: "end" ,reward: { type: 'merchant', tier: 'purple' }} }
    ]
},

{
    name: "工匠·匠心独运",
    list: [
        { id: "d1", title: "学徒生涯", desc: "师父不仅打铁，还会修锁。你看着炉火，心想是要做个铁匠，还是学些精巧手艺？", left: { text: "专心学打铁", effect: { tech: 1 }, nextId: "d2_iron" }, right: { text: "偷学修锁", effect: { tech: 1 }, nextId: "d2_lock" } },
        { id: "d2_iron", title: "改良农具", desc: "你打的锄头结实耐用，乡亲们都夸。工部侍郎路过，看中了你。", left: { text: "随侍郎入京，求个出身", effect: { tech: 2 }, nextId: "d3_official" }, right: { text: "留在乡里，造福乡亲",  nextId: "d3_local" } },
        { id: "d2_lock", title: "奇思妙想", desc: "你发明了连环锁，名声传开了。有人重金求购图纸。", left: { text: "卖给富商，赚取暴利",  nextId: "d3_rich" }, right: { text: "献给官府，以此邀功", effect: { tech: 2 }, nextId: "d3_official" } },
        { id: "d3_official", title: "入匠籍", desc: "你成了官匠，虽不自由，但衣食无忧。", left: { text: "兢兢业业，听命行事", effect: { tech: 1 }, nextId: "d4_off_work" }, right: { text: "钻研图纸，试图革新", effect: { tech: 2 }, nextId: "d4_off_study" } },
        { id: "d3_local", title: "乡间名匠", desc: "你收了几个徒弟，虽然清贫，但受人尊敬。", left: { text: "传授技艺，桃李满天下",  nextId: "d4_local_teach" }, right: { text: "保守秘密，传男不传女",  nextId: "d4_local_secret" } },
        { id: "d3_rich", title: "富家翁", desc: "你赚了大钱，但也招来了是非。同行嫉妒你的才华，地痞觊觎你的钱财。", left: { text: "继续发明，哪怕倾家荡产", effect: { merchant: -1 }, nextId: "d4_rich_invent" }, right: { text: "享受生活，但这世道不太平",  nextId: "d4_rich_invent" } },
        
        { id: "d4_off_work", title: "官匠生涯", desc: "你参与了皇陵修建，虽无大功，但也无过。", left: { text: "因资历升迁", effect: { tech: 1 }, nextId: "d5_elite" }, right: { text: "退休还乡",  nextId: "d5_end_normal" } },
        { id: "d4_off_study", title: "神机妙算", desc: "你改良了连弩，威力惊人。", left: { text: "参军效力，沙场立功",  nextId: "d5_elite" }, right: { text: "留守工部，专司制造", effect: { tech: 1 }, nextId: "d5_elite" } },
        { id: "d4_local_teach", title: "桃李满天下", desc: "徒弟们都很孝顺，为你养老送终。", left: { text: "安享晚年",  nextId: "d5_end_normal" }, right: { text: "继续打铁", effect: { tech: 1 }, nextId: "d5_end_normal" } },
        { id: "d4_local_secret", title: "独门绝技", desc: "你守着祖传手艺，却引来了同行嫉妒。", left: { text: "被打压，生意惨淡",  nextId: "d5_end_normal" }, right: { text: "和解，分享利益",  nextId: "d5_end_normal" } },

        // --- 植入随机检定节点 ---
        // 设定：左(发明) = 押小；右(享受) = 押大
        { 
            id: "d4_rich_invent", title: "命运的分叉", desc: "你站在人生的十字路口。继续钻研可能流芳百世，也可能一无所有；安享富贵可能太平无事，也可能坐吃山空。命运女神在向你微笑。", 
            left: { text: "孤注一掷，继续发明", effect: {}, special: "gamble", winNext: "d_invent_gamble_win", loseNext: "d_invent_gamble_lose" }, 
            right: { text: "见好就收，享受生活", effect: {}, special: "gamble", winNext: "d_enjoy_gamble_win", loseNext: "d_enjoy_gamble_lose" } 
        },
        // 发明路线：押小赢
        { id: "d_invent_gamble_win", title: "神工天巧", desc: "你的发明惊动了圣人！不仅未受刁难，反而获赐金牌，成了天下闻名的“神匠”。", left: { text: "谢恩", effect: { tech: 3 }, nextId: "d6_end_elite" }, right: { text: "谢恩", effect: { tech: 3 }, nextId: "d6_end_elite" } },
        // 发明路线：押小输
        { id: "d_invent_gamble_lose", title: "怀璧其罪", desc: "贪官污吏眼红你的技艺和财富，构陷你私藏甲胄。家产被抄，你被打入大牢，郁郁而终。", left: { text: "绝望",  nextId: "d6_end_jail" }, right: { text: "绝望",  nextId: "d6_end_jail" } },
        // 享受路线：押大赢
        { id: "d_enjoy_gamble_win", title: "富贵闲人", desc: "虽然没做出什么惊天动地的大事，但你散尽家财结交权贵，落得个逍遥自在，安享晚年。", left: { text: "知足了",  nextId: "d5_end_normal" }, right: { text: "知足了",  nextId: "d5_end_normal" } },
        // 享受路线：押大输
        { id: "d_enjoy_gamble_lose", title: "坐吃山空", desc: "纸醉金迷的生活掏空了家底。昔日的富商如今流落街头，手中只剩下一把生锈的铁锤。", left: { text: "悔恨",  nextId: "d6_end_beggar" }, right: { text: "悔恨",  nextId: "d6_end_beggar" } },

        { id: "d5_elite", title: "大国工匠", desc: "你的名字被载入史册，成为一代宗师。", left: { text: "...", effect: { tech: 3 }, nextId: "d6_end_elite" }, right: { text: "...", effect: { tech: 3 }, nextId: "d6_end_elite" } },
        { id: "d5_end_normal", title: "手艺人", desc: "你靠着这双手，养活了一家老小，临终时，手里还攥着那把铁锤。", left: { text: "...",  nextId: "end" ,reward: { type: 'people', tier: 'blue' }}, right: { text: "...",  nextId: "end",reward: { type: 'people', tier: 'blue' } } },
        
        { id: "d6_end_elite", title: "一代宗师", desc: "你的技艺登峰造极，世人皆称你为“鲁班在世”。", left: { text: "结局", effect: { tech: 3 }, nextId: "end" ,reward: { type: 'people', tier: 'purple' }}, right: { text: "结局", effect: { tech: 3 }, nextId: "end" ,reward: { type: 'people', tier: 'purple' }} },
        { id: "d6_end_jail", title: "狱中枯骨", desc: "无人收尸，草席裹身，抛于乱葬岗。", left: { text: "结局",  nextId: "end",reward: { type: 'people', tier: 'common' } }, right: { text: "结局",  nextId: "end",reward: { type: 'people', tier: 'common' } } },
        { id: "d6_end_beggar", title: "落魄匠人", desc: "你饿死在曾经辉煌过的作坊门口。", left: { text: "结局",  nextId: "end" ,reward: { type: 'people', tier: 'blue' }}, right: { text: "结局",  nextId: "end",reward: { type: 'people', tier: 'blue' } } }
    ]
},

// --- 剧本五：农桑·在此山中 (底层·含双重随机检定) ---
{
    name: "农桑·在此山中",
    list: [
        // 起点
        { id: "e1", title: "春耕大忙", desc: "布谷鸟叫了，该下种了。你看着那几亩薄田，心里盘算着今年的收成。", left: { text: "精耕细作，听天由命",  nextId: "e2_work" }, right: { text: "进城找活路，不甘心土里刨食",  nextId: "e2_city" } },
        
        // --- 务农线 ---
        { id: "e2_work", title: "风调雨顺", desc: "老天爷赏饭吃，庄稼长势喜人。官府的差役来了，要收租。", left: { text: "足额交租，求得安稳", effect: { treasury: 1 }, nextId: "e3_good" }, right: { text: "藏起一部分，想给家里留点口粮", effect: { treasury: -1, people: 1 }, nextId: "e3_hide" } },
        
        { id: "e3_good", title: "安居乐业", desc: "交完租，剩下的粮够吃半年。冬天快到了，得准备冬衣。", left: { text: "纺纱织布，自给自足",  nextId: "e4_winter" }, right: { text: "闲着过年，哪怕冻着", effect: { culture: 1 }, nextId: "e4_winter" } },
        
        // 【检定点1】：藏粮后的命运
        // 设定：左(哭诉) = 押小；右(行贿) = 押大
        { 
            id: "e3_hide", title: "差役上门", desc: "差役踢开了你的米缸，目光阴冷。你心跳如鼓，必须立刻做出决定。", 
            left: { text: "下跪磕头，哭诉家贫", effect: {}, special: "gamble", winNext: "e_hide_win", loseNext: "e_hide_lose" }, 
            right: { text: "塞银子，赌他是个贪官", effect: {}, special: "gamble", winNext: "e_hide_win", loseNext: "e_hide_lose" } 
        },
        { id: "e_hide_win", title: "侥幸过关", desc: "差役掂了掂银子（或是看你实在可怜），哼了一声，转身走了。你瘫坐在地上，冷汗湿透了后背。", left: { text: "躲过一劫", effect: { treasury: -5, people: 5 }, nextId: "e4_winter" }, right: { text: "躲过一劫", effect: { treasury: -5, people: 5 }, nextId: "e4_winter" } },
        { id: "e_hide_lose", title: "人财两空", desc: "差役一脚将你踹翻，夺走了银子和粮食，还把你抓去做了壮丁。", left: { text: "绝望",  nextId: "e4_lose" }, right: { text: "绝望",  nextId: "e4_lose" } },

        // --- 进城线 ---
        { id: "e2_city", title: "码头扛包", desc: "你到了城里，发现城里人也不好过。码头工头看着你，眼神像看牲口。", left: { text: "忍气吞声，攒钱买地",  nextId: "e3_land" }, right: { text: "听说赌坊能一夜暴富，去看看", effect: { merchant: -1 }, nextId: "e3_gamble" } },
        
        { id: "e3_land", title: "置办家业", desc: "十年血汗，你终于买下了那几亩地。地契在手，你热泪盈眶。", left: { text: "娶妻生子，扎根土地",  nextId: "e4_family" }, right: { text: "独自生活，守着地",  nextId: "e4_alone" } },
        
        // 【检定点2】：赌博翻本
        // 设定：左(押大) = 押大；右(押小) = 押小
        { 
            id: "e3_gamble", title: "孤注一掷", desc: "你站在赌桌前，手里攥着最后的本钱。周围人声鼎沸，你感到一阵眩晕。", 
            left: { text: "押大！", effect: {}, special: "gamble", winNext: "e_gamble_win", loseNext: "e_gamble_lose" }, 
            right: { text: "押小！", effect: {}, special: "gamble", winNext: "e_gamble_win", loseNext: "e_gamble_lose" } 
        },
        { id: "e_gamble_win", title: "时来运转", desc: "骰子落定...开了！你赢了！银子哗啦啦地流进你的口袋。你紧紧抱着钱袋，生怕这只是个梦。", left: { text: "见好就收，回乡买地",  nextId: "e3_land" }, right: { text: "再赌一把！",  nextId: "e_gamble_win" } },
        { id: "e_gamble_lose", title: "一无所有", desc: "骰子落定...完了。全完了。你瘫倒在地上，被赌坊打手扔到了大街上。", left: { text: "流落街头",  nextId: "e4_lose" }, right: { text: "想寻短见",  nextId: "e4_lose" } },

        // --- 结局分支 ---
        { id: "e4_winter", title: "寒冬腊月", desc: "大雪封门，一家人围着火炉。孩子饿得直哭，你心如刀绞。", left: { text: "给孩子讲故事，画饼充饥", effect: { culture: 1 }, nextId: "e5_spring" }, right: { text: "规划明年，咬牙坚持",  nextId: "e5_spring" } },
        { id: "e4_lose", title: "艰难求生", desc: "日子苦得像黄连，但你不能死，死了家就散了。", left: { text: "乞讨为生",  nextId: "e5_end_normal" }, right: { text: "乞讨为生",  nextId: "e5_end_normal" } },
        { id: "e4_family", title: "儿孙满堂", desc: "你的孩子们长大了，有的种地，有的读书。你老了，腰也直不起来了。", left: { text: "教导他们种地，守住家业",  nextId: "e5_end_good" }, right: { text: "送他们去读书，改换门庭",  nextId: "e5_end_good" } },
        { id: "e4_alone", title: "独自一人", desc: "你守着那几亩地，守了一辈子。", left: { text: "孤独终老",  nextId: "e5_end_normal" }, right: { text: "孤独终老",  nextId: "e5_end_normal" } },
        
        { id: "e5_spring", title: "春暖花开", desc: "熬过了冬天，官府又要征税了。听说外面的世道乱了。", left: { text: "继续种地，管他天塌下来",  nextId: "e6_end_farmer" }, right: { text: "去城里看看，哪怕是死也要死个明白",  nextId: "e6_end_merchant" } },
        
        // 结局
        { id: "e6_end_farmer", title: "富农", desc: "你躺在摇椅上，看着金黄的麦浪。这一生虽然劳碌，但也踏实。你闭上了眼，梦到了小时候在田埂上奔跑。", left: { text: "...",  nextId: "end" ,reward: { type: 'merchant', tier: 'purple' }}, right: { text: "...",  nextId: "end" ,reward: { type: 'merchant', tier: 'purple' }} },
        { id: "e6_end_merchant", title: "小商贩", desc: "你做起了小买卖，虽没发大财，但也饿不死。", left: { text: "...",  nextId: "end"  ,reward: { type: 'merchant', tier: 'common' }}, right: { text: "...",  nextId: "end"  ,reward: { type: 'merchant', tier: 'common' }} },
        { id: "e5_end_good", title: "富农", desc: "家境殷实，儿孙孝顺。你是十里八乡有名的善人。", left: { text: "...",  nextId: "end",reward: { type: 'merchant', tier: 'bule' } }, right: { text: "...",  nextId: "end" ,reward: { type: 'merchant', tier: 'blue' }} },
        { id: "e5_end_normal", title: "贫农", desc: "你佝偻着背，在寒风中捡拾麦穗。你不知道这苦日子什么时候是个头，只知道，活一天，算一天。", left: { text: "...",  nextId: "end" ,reward: { type: 'people', tier: 'common' }}, right: { text: "...",  nextId: "end" ,reward: { type: 'people', tier: 'common' }} }
    ]
}
];

// --- 政务处理事件 (原灾害事件改写) ---
// --- 政务处理事件 (丰富版) ---
const governmentEvents = [
    {
        name: "科举舞弊案",
        questions: [
            { 
                id: "gov1_q1", title: "科举舞弊", desc: "有人举报本次科举主考官收受贿赂，泄露考题。证据确凿，但主考官是当朝宰相的门生。", 
                left: { text: "依法严查，不管后台", effect: { people: 15, culture: 5 } }, 
                right: { text: "私下警告，大事化小", effect: { treasury: 10, people: -10 } } 
            },
            { 
                id: "gov1_q2", title: "考生抗议", desc: "处理结果公布后，落榜考生在贡院门前抗议，认为其中有黑幕，甚至有人绝食。", 
                left: { text: "增加名额，安抚人心", effect: { treasury: -10, people: 10 } }, 
                right: { text: "派兵驱散，维护秩序", effect: { military: 5, people: -15 } } 
            },
            { 
                id: "gov1_q3", title: "真假试卷", desc: "查抄出的泄题试卷，字迹竟与当朝状元一模一样。是陷害，还是确有其事？", 
                left: { text: "取消状元资格", effect: { culture: 10, people: 5 } }, 
                right: { text: "判定为陷害，维持原判", effect: { culture: -5, people: -5 } } 
            },
            { 
                id: "gov1_q4", title: "宰相干预", desc: "宰相暗示你到此为止，并许诺给你一批金银。若继续查下去，恐怕官位不保。", 
                left: { text: "拒绝诱惑，一查到底", effect: { people: 20, treasury: -20 } }, 
                right: { text: "见好就收，接受金银", effect: { treasury: 30, culture: -20 } } 
            },
            { 
                id: "gov1_q5", title: "最终裁决", desc: "案件终于水落石出。不论结果如何，科举的公信力都受到了挑战。", 
                left: { text: "重整顿肃考场", effect: { culture: 15 } }, 
                right: { text: "维持现状", effect: { treasury: 5 } } 
            }
        ]
    },
    {
        name: "边关互市争端",
        questions: [
            { 
                id: "gov2_q1", title: "互市冲突", desc: "边关互市中，胡商与大唐商户发生斗殴，双方各有损伤。胡商声称被欺诈。", 
                left: { text: "严惩大唐商户", effect: { people: -10, culture: 10 } }, 
                right: { text: "驱赶胡商，护我子民", effect: { people: 5, military: 5 } } 
            },
            { 
                id: "gov2_q2", title: "物品检疫", desc: "在查验货物时，发现胡商的马匹中混入了几匹带有疫病的马，若流入民间后果不堪设想。", 
                left: { text: "全部扑杀，杜绝后患", effect: { treasury: -20, people: -10 } }, 
                right: { text: "低价收购，隔离治疗", effect: { treasury: 5, people: 10 } } 
            },
            { 
                id: "gov2_q3", title: "走私军火", desc: "截获了一批走私的精良兵器，竟是运往内地私贩的。背后似乎有军方背景。", 
                left: { text: "彻查军方，没收兵器", effect: { military: -20, people: 10 } }, 
                right: { text: "睁只眼闭只眼", effect: { military: 5, treasury: 15 } } 
            },
            { 
                id: "gov2_q4", title: "通商口岸", desc: "胡商请求开放新的通商口岸，以便货物吞吐。但这可能会冲击本地手工业。", 
                left: { text: "开放口岸，鼓励贸易", effect: { treasury: 20, people: -20 } }, 
                right: { text: "保护本土，拒绝开放", effect: { people: 10, treasury: -10 } } 
            },
            { 
                id: "gov2_q5", title: "关税定夺", desc: "互市即将结束，今年的关税收入颇丰，但也引发了物价上涨。", 
                left: { text: "降低关税，平抑物价", effect: { people: 15, treasury: -20 } }, 
                right: { text: "维持高税，充实国库", effect: { treasury: 25, people: -10 } } 
            }
        ]
    },
    {
        name: "宫廷乐师选拔",
        questions: [
            { 
                id: "gov3_q1", title: "乐师选拔", desc: "宫中要选拔新的乐师，各地推荐的人选中，既有技艺高超的民间艺人，也有不通音律的权贵子弟。", 
                left: { text: "唯才是举，选民间艺人", effect: { culture: 15, people: 5 } }, 
                right: { text: "给权贵面子，选子弟", effect: { treasury: 10, culture: -20 } } 
            },
            { 
                id: "gov3_q2", title: "排练冲突", desc: "新旧乐师在排练时发生冲突，老乐师认为新曲离经叛道，坏了祖宗规矩。", 
                left: { text: "支持创新，贬谪老乐师", effect: { culture: 10, people: -10 } }, 
                right: { text: "尊崇传统，修改新曲", effect: { people: 5, culture: -10 } } 
            },
            { 
                id: "gov3_q3", title: "乐器采购", desc: "为了筹备大典，需要采购一批昂贵的西域乐器。户部表示没钱，内务府却想借机敛财。", 
                left: { text: "从简办理，用旧乐器", effect: { treasury: 10, culture: -10 } }, 
                right: { text: "拨款采购，不求最好", effect: { treasury: -20, culture: 10 } } 
            },
            { 
                id: "gov3_q4", title: "贵妃的请求", desc: "贵妃想让自己的亲戚在乐队中谋个闲职，但这会破坏编制，引起其他乐师不满。", 
                left: { text: "拒绝贵妃，依规矩办事", effect: { people: 10 } }, 
                right: { text: "给贵妃面子，安插亲信", effect: { treasury: 10, people: -20 } } 
            },
            { 
                id: "gov3_q5", title: "大典献艺", desc: "大典在即，曲目终于定下。这一曲，将决定今年的文化风向。", 
                left: { text: "演奏《秦王破阵乐》", effect: { military: 10, culture: 5 } }, 
                right: { text: "演奏《霓裳羽衣曲》", effect: { people: 10, culture: 5 } } 
            }
        ]
    }
];

// --- 预言事件定义 (新增) ---
// 结构：预警信息 -> 倒计时UI -> 结算事件
const prophecyEvents = [
    {
        id: "p_food",
        name: "暴雨将至",
        desc: "国师预言，三日之后，暴雨将摧毁无数田地。",
        warningText: "暴雨降至",
        require: { type: 'treasury', count: 50 },
        duration: 30,
        successDesc: "暴雨倾盆，在消耗了适当的粮食储备后，灾民得以赈济。",
        failDesc: "暴雨冲毁农田，粮仓告急，饿殍遍野。",
        failEffect: { treasury: -50 }
    },
    {
        id: "p_people",
        name: "瘟神肆虐",
        desc: "太医令急报，南方发现无名热症，恐有蔓延之势。",
        warningText: "瘟疫肆虐",
        require: { type: 'people', count: 50 },
        duration: 30,
        successDesc: "封锁得当，药材备足，疫情很快平息，但科技却受到了影响。",
        failDesc: "疫情失控，十室九空，科技的发展受到了重创。",
        failEffect: { people: -50}
    },
    {
        id: "p_military",
        name: "蛮族窥探",
        desc: "边关斥候发现，北方蛮族正在集结，似有南下之意。",
        warningText: "蛮族入侵",
        require: { type: 'military', count: 50 },
        duration: 30,
        successDesc: "边军严阵以待，蛮族虽退，军力却有所损耗。",
        failDesc: "边防松懈，蛮族破关而入，劫掠而去。军力受损。",
        failEffect: { military: -50}
    },
    {
        id: "p_culture",
        name: "异端邪说",
        desc: "坊间流传禁书，煽动百姓对抗官府，蛊惑人心。",
        warningText: "异端邪说",
        require: { type: 'culture', count: 50 },
        duration: 30,
        successDesc: "开坛讲学，以理服人，虽有效果，文明根基却受到了影响。",
        failDesc: "邪说蔓延，民变四起，文化教育大受影响。",
        failEffect: { culture: -50}
    },
    // --- 双资源大灾难 (小概率触发) ---
    {
        id: "p_double_war",
        name: "内忧外患",
        desc: "国师夜观天象，紫微暗淡，恐有内乱与外患同时发生。",
        warningText: "内忧外患",
        require: { type: 'military', count: 40, type2: 'people', count2: 40 },
        duration: 45,
        successDesc: "内有良将，外有民心，危机虽除，国力却受到了损耗。",
        failDesc: "外敌入侵，内部叛乱，朝廷焦头烂额，军力和科技发展都受到了影响。",
        failEffect: { military: -40, people: -40 }
    },
    {
        id: "p_double_famine",
        name: "天地大旱",
        desc: "钦天监预警，明年将是百年不遇之大旱，赤地千里。",
        warningText: "大旱",
        require: { type: 'treasury', count: 40, type2: 'culture', count2: 40 },
        duration: 45,
        successDesc: "开仓放粮，祈雨成功，百姓虽度过难关，粮食储备却大大减少，文化受到了冲击。",
        failDesc: "旱灾蔓延，饥民易子而食，粮食锐减，文化受到了冲击。",
        failEffect: { treasury: -40, culture: -40 }
    }
];

const crisisTree = [
    { 
        id: "crisis_1", 
        title: "安禄山造反", 
        desc: "范阳节度使安禄山以“清君侧”为名，起兵二十万南下。河北州县望风而降，战报如雪片般飞入长安，朝野震惊。", 
        left: { text: "立即派兵镇压，御敌于国门", effect: { military: -10, treasury: -5 }, nextId: "crisis_2_war" }, 
        right: { text: "坚守潼关，等待各地勤王", effect: { people: -5, military: 5 }, nextId: "crisis_2_def" } 
    },
    { 
        id: "crisis_2_war", 
        title: "野战失利", 
        desc: "唐军在平原仓促迎战，因指挥不力大败。安禄山叛军逼近洛阳，前锋直指潼关。", 
        left: { text: "处决败将，整肃军纪", effect: { military: 5, people: -5 }, nextId: "crisis_3_judge" }, 
        right: { text: "退守潼关，保存实力", effect: { people: 5, military: -5 }, nextId: "crisis_3_judge" } 
    },
    { 
        id: "crisis_2_def", 
        title: "坚守不出", 
        desc: "潼关守军虽坚如磐石，但粮草将尽。后方传来消息，有人弹劾你畏战不前。", 
        left: { text: "出关迎战，以证清白", effect: { military: -15, people: 5 }, nextId: "crisis_3_bad" }, 
        right: { text: "死守待援，不被动摇", effect: { people: -10, military: 10 }, nextId: "crisis_3_judge" } 
    },
    { 
        id: "crisis_3_bad", 
        title: "潼关失守", 
        desc: "出关迎敌，中了埋伏。潼关失守，长安危在旦夕，百官惊慌失措。", 
        left: { text: "...", effect: { people: -20 }, nextId: "crisis_3_judge" }, 
        right: { text: "...", effect: { people: -20 }, nextId: "crisis_3_judge" } 
    },
    { 
        id: "crisis_3_judge", 
        title: "危急存亡", 
        desc: "叛军兵临城下，此时只有两个选择：要么拼死一搏，要么避其锋芒。", 
        left: { text: "御驾亲征，与国运共生死", effect: {}, nextId: "end_battle" }, 
        right: { text: "弃城逃往蜀地，徐图后计", effect: {}, nextId: "end_flee" } 
    }
];

// 角色品质定义
const QUALITY_CONFIG = {
    common:  { name: '普通', color: '#a0a0a0', fontColor: '#333', rate: 0.60 }, // 60%概率
    blue:    { name: '蓝色', color: '#4a90e2', fontColor: '#fff', rate: 0.25 }, // 25%概率
    purple:  { name: '紫色', color: '#9b59b6', fontColor: '#fff', rate: 0.10 }, // 10%概率
    gold:    { name: '金色', color: '#f1c40f', fontColor: '#fff', rate: 0.05 }  // 5%概率
};

// 角色身份定义 (4种品质 x 4种定位)
// isDouble: 是否产出双资源
const CHARACTER_ROLES = {
    // 商业系 (粮食 Treasury)
    merchant: {
        tiers: {
            common: { name: '街头小贩', bonus: { treasury: 5 },icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character4.png', isDouble: false },
            blue:   { name: '店铺老板', bonus: { treasury: 10 },icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character1.png', isDouble: false },
            purple: { name: '一方乡绅', bonus: { treasury: 15, people: 5 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character11.png',isDouble: true },
            gold:   { name: '富甲一方', bonus: { treasury: 25, culture: 10 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character12.png',isDouble: true }
        }
    },
    // 军事系
    military: {
        tiers: {
            common: { name: '乡野农夫', bonus: { treasury: 5 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character6.png',isDouble: false },
            blue:   { name: '低等士卒', bonus: { military: 10 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character8.png',isDouble: false },
            purple: { name: '江湖浪子', bonus: { military: 15, treasury: 5 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character8.png',isDouble: true },
            gold:   { name: '一代名将', bonus: { military: 25, people: 10 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character2.png',isDouble: true }
        }
    },
    // 文化系+政治
    culture: {
        tiers: {
            common: { name: '说书艺人', bonus: { culture: 5 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character3.png',isDouble: false },
            blue:   { name: '私塾先生', bonus: { culture: 10 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character10.png',isDouble: false },
            purple: { name: '翰林学士', bonus: { culture: 15, treasury: 5 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character13.png',isDouble: true },
            gold:   { name: '朝堂要员', bonus: { culture: 25, people: 10 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character13.png',isDouble: true }
        }
    },
    // 科技+商人
    people: {
        tiers: {
            common: { name: '流落街头', bonus: { people: 5 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character9.png',isDouble: false },
            blue:   { name: '手艺匠人', bonus: { people: 15 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character5.png',isDouble: false },
            purple: { name: '大国工匠', bonus: { people: 20, culture: 5 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character7.png',isDouble: true },
            gold:   { name: '大国工匠(缺)', bonus: { people: 25, military: 10 }, icon: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/character7.png',isDouble: true }
        }
    }
};

function getQualityConfig(quality) {
    return QUALITY_CONFIG[quality] || QUALITY_CONFIG.common;
}

// --- 游戏状态变量 ---
let currentPhase = "POLICY", currentCardIndex = 0, currentDeck = [], cardMap = {}, nextCardId = null, charScores = {}, gameTime = 0, finalCountdown = 300, incomeTimer = 0, recruitSlots = 0, recruitTimer = RECRUIT_COOLDOWN, specialEventCount = 0, pendingDisaster = false, characters = [], gameLoopInterval, lastTime = 0, lastStoryIndex = -1;

// 新增：预言系统变量
let prophecyState = null; // { event, timer }
let prophecyCount = 0;

characters = [], gameLoopInterval, lastTime = 0, lastStoryIndex = -1;

// UI 缓存
const ui = {
    eventTitle: document.getElementById('event-title'), eventDesc: document.getElementById('event-desc'), 
    txtLeft: document.getElementById('txt-left'), txtRight: document.getElementById('txt-right'),
    swipeCard: document.getElementById('swipe-card'),   swipeArea: document.getElementById('swipe-area'), // 【新增】缓存滑动区域容器
buildingsContainer: document.getElementById('buildings-container'), overlay: document.getElementById('overlay'), resultTitle: document.getElementById('result-title'), resultDesc: document.getElementById('result-desc'),
    idlePanel: document.getElementById('idle-panel'), finalTimer: document.getElementById('final-timer'), incomeStats: document.getElementById('income-stats'), sideUI: document.getElementById('side-ui'),
    recruitBtn: document.getElementById('recruit-btn'), recruitStatus: document.getElementById('recruit-status'), progressRing: document.querySelector('#progress-ring circle'), disasterBtn: document.getElementById('disaster-btn'),
    barLeft: document.getElementById('bar-left'), barRight: document.getElementById('bar-right'),
    resValues: {}, resItems: {},
    sceneMask: document.getElementById('scene-mask') ,
    buildPanel: document.getElementById('build-panel'),
    buildGrid: document.getElementById('build-grid')
};

function cacheUIElements() {
    ['treasury', 'people', 'military', 'culture'].forEach(k => {
        let item = document.getElementById(`res-item-${k}`); ui.resItems[k] = item; if(item) ui.resValues[k] = item.querySelector('.res-value');
    });
}

// --- 新增：移动端视口高度修正 ---
function resizeGame() {
    const container = document.getElementById('game-container');
    if (container) {
        // 获取实际可视高度
        const h = window.innerHeight;
        // 强制设置容器高度
        container.style.height = h + 'px';
        
        // 触发重新布局，解决部分浏览器重绘问题
        container.offsetHeight; 
    }
}

function showMask()
 { ui.sceneMask.classList.add('active'); 
// 新增：给底部区域加上深色背景，使其变暗
    ui.swipeArea.style.background = 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.5))'; 
}
function hideMask() { ui.sceneMask.classList.remove('active');
// 新增：移除底部区域的背景，使其变透明，挂机时能看到后面的景色
    ui.swipeArea.style.background = 'transparent';
 }

function initGame() {

    // 【新增】立即修正高度，并监听窗口变化
    resizeGame(); 
    window.addEventListener('resize', resizeGame);

 // 1. 隐藏顶部资源增长
    const incomeStats = document.getElementById('income-stats');
    if(incomeStats) incomeStats.style.display = 'none';

    // 2. 初始化所有变量
    resources = { treasury: 50, people: 50, military: 50, culture: 50 }; 
    incomeRates = { treasury: 5, people: 5, military: 5, culture: 5 }; 
    placedBuildings = [];
    characters = []; 
    gameTime = 0; 
    recruitSlots = 2; 
    recruitTimer = RECRUIT_COOLDOWN; 
    specialEventCount = 0; 
    pendingDisaster = false;
    prophecyState = null;
    prophecyCount = 0;
    currentCardIndex = 0; 
    currentDeck = [];
      // 重置事件触发标记
    triggeredEvents = {
        prophecy1: false, gov1: false, 
        prophecy2: false, gov2: false, 
        prophecy3: false
    };
    
    cacheUIElements(); 
    ui.buildingsContainer.innerHTML = ''; 
    ui.overlay.style.display = 'none'; 
    ui.idlePanel.style.display = 'none'; 
    ui.sideUI.style.display = 'none'; 
    ui.swipeCard.style.display = 'flex';
    
    // 创建预言倒计时UI
    createProphecyPanel();
    
    updateUI(); 
    updateRecruitUI(); 
    setupSwipeEvents();

    // 4. 绑定全局点击事件 (只负责加资源和飘字)
      document.addEventListener('click', (e) => {
        // 【新增】如果锁开启，则关闭锁并直接返回，不执行后续逻辑
        if (suppressNextClick) {
            suppressNextClick = false;
            return;
        }
        
        if (isBuildingMode) return;
        // 【修改】允许 IDLE 和 PROPHECY_ACTIVE 状态下点击
        if (currentPhase !== 'IDLE' && currentPhase !== 'PROPHECY_ACTIVE') return;
        
        const target = e.target;
        if (target.closest('#side-ui') || target.closest('#swipe-card') || target.closest('#idle-panel') || target.closest('.resource-bubble') || target.closest('#build-panel')) {
            return;
        }
        
        const types = ['treasury', 'people', 'military', 'culture'];
        const type = types[Math.floor(Math.random() * types.length)];
        resources[type]++;
        
        // 【新增】播放绿色增加动画
        highlightRes(type, true); 
        
        updateUI();

         // 【新增】检测数值过高导致的失败
    let h = checkHighStatFail();
    if (h) { 
        setTimeout(() => showResult(false, h), 300); 
        clearInterval(gameLoopInterval); 
        return; // 结束后不再执行飘字
    }

        // 关键：这里只调用飘字，不启动游戏
        createFloatingText(e.clientX, e.clientY, type, 1);
    }, true); 

    // 5. 启动游戏循环
     if(gameLoopInterval) clearInterval(gameLoopInterval); 
    lastTime = Date.now(); 
    gameLoopInterval = setInterval(gameLoop, 100);

    // 6. 背景重置
    const bgMask = document.getElementById('bg-mask');
    if(bgMask) {
        bgMask.style.transition = 'none'; 
        bgMask.style.opacity = 1;
        void bgMask.offsetHeight; 
        bgMask.style.transition = 'opacity 120s ease'; 
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bgMask.style.opacity = 0;
            });
        });
    }

       // 绑定拖拽事件 (用于放置建筑)
    document.addEventListener('mousemove', handleBuildingDrag);
    document.addEventListener('touchmove', handleBuildingDrag, { passive: false });
    document.addEventListener('mouseup', placeBuilding);
    document.addEventListener('touchend', placeBuilding);

    // 7. 启动序幕 (只执行一次)
    startSnow(); 
    startIntro(); 
}

// 【新增】飘字效果函数（放在 initGame 函数外面）
function createFloatingText(x, y, type, val, customDuration) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    
    const urls = { 
        treasury: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/food.png', 
        people: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/tech.png', 
        military: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/army.png', 
        culture: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/culture1.png' 
    };

    const isNegative = val < 0;
    const displayVal = Math.abs(val);
    const prefix = isNegative ? '-' : '+';
    
    // 设置颜色
    el.style.color = isNegative ? '#ff4d4d' : '#fff';
    el.innerHTML = `<img src="${urls[type]}" style="width:18px; height:18px; vertical-align:middle; margin-right:2px;">${prefix}${displayVal}`;
    
    // 随机左右偏移
    const offsetX = (Math.random() - 0.5) * 40;
    el.style.left = (x + offsetX) + 'px';
    el.style.top = y + 'px';
    
    // 【修复】正确设置持续时间
    // 如果传入 customDuration 则使用它，否则默认 600ms
    const duration = customDuration || 600;
    
    document.body.appendChild(el);
    
    // 设置过渡动画时间
    el.style.transition = `all ${duration}ms ease-out`; 
    
    // 关键：必须等元素渲染一帧后再改变样式，否则过渡动画不会触发
    requestAnimationFrame(() => {
        el.style.opacity = '0';
        el.style.transform = `translateY(-30px)`; // 向上飘
    });
    
    // 动画结束后移除元素
    setTimeout(() => el.remove(), duration);
}

function createProphecyPanel() {
    let panel = document.getElementById('prophecy-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'prophecy-panel';
        // 【样式调整】
        // right: 10px (距离右边10px)
        // bottom: 650px (距离底部650px，调整此值可改变整体位置)
        // align-items: flex-end (让内部元素靠右对齐，实现倒计时在右下角的效果)
        panel.style.cssText = `
            position: absolute; 
            right: 10px; 
            bottom: 650px; 
            display: none; 
            flex-direction: column; 
            align-items: flex-end; 
            gap: 2px; 
            z-index: 150; 
        `;
        document.getElementById('game-container').appendChild(panel);
    }
}

function startIntro() {
    currentPhase = "INTRO";
    showMask(); 
    
    ui.eventTitle.innerText = "序幕";
    ui.eventDesc.innerText = "一个新的王朝拉开了序幕 \n 请左右滑动下方卡片开始游戏 \n  \n （注：建造页面有四行，可向下滑动） \n （将建筑拖动到场景中进行建造） \n （开始游戏后，点击屏幕可获得少许资源） \n （单项数值过高或过低都会导致文明覆灭） \n （图片资源保存在github中，可能会受网络影响）";
    
    ui.txtLeft.innerText = "开始"; 
    ui.txtRight.innerText = "开始"; 
    ui.txtLeft.classList.remove('active');
    ui.txtRight.classList.remove('active');
    
    ui.swipeCard.style.transition = 'none';
    ui.swipeCard.style.transform = 'translateX(0) rotate(0)';
    ui.swipeCard.style.opacity = 1;
    ui.swipeCard.offsetTop; 
    updateCardVisual(0);
}

function startPolicyPhase() {
    currentPhase = "POLICY";
    loadDeck(policyTrees[Math.floor(Math.random() * policyTrees.length)]);
    // 【修改】移除了 showNextCard() 和 refreshCard()
    // 因为 dragEnd 函数会在 handleChoice 返回 true 后自动调用 showNextCard()
    // 这里只需要准备好数据 (loadDeck) 即可
}

// --- 新增：触发预言事件 ---
function triggerProphecy() {
    prophecyCount++;
    
    // 随机选择预言 (第2次有概率出双资源)
    let pool = prophecyEvents.slice(0, 4); // 默认前4个单资源
    if (prophecyCount === 2) {
        // 第二次预言，加入双资源大灾难
        pool = pool.concat(prophecyEvents.slice(4)); 
    }
    
    const event = pool[Math.floor(Math.random() * pool.length)];
    
    // 显示预警提示 (不可操作，仅提示)
    currentPhase = "PROPHECY_WARNING";
    showMask();
    ui.eventTitle.innerText = "国师预言";
    ui.eventDesc.innerText = event.desc + `\n\n请储备资源以备不时之需。`;
    ui.swipeCard.style.display = 'flex';
    
    // 2秒后自动关闭，进入倒计时
    setTimeout(() => {
        hideMask();
        ui.swipeCard.style.display = 'none';
        currentPhase = "IDLE";
        
        // 开启预言倒计时状态
        prophecyState = {
            event: event,
            timer: event.duration
        };
        updateProphecyUI();
    }, 3000);
}

// --- 阶段1：触发预言介绍 ---
// 修改：增加 forceDouble 参数
function triggerProphecyIntro(forceDouble = false) {
    // 1. 设置状态 (阻止人物移动和重复触发)
    currentPhase = "PROPHECY_WARNING"; 
    showMask(); // 显示遮罩
    
    // 2. 选择事件
    let pool;
    if (forceDouble) {
        pool = prophecyEvents.slice(4); 
        if(pool.length === 0) pool = prophecyEvents; // 保底
    } else {
        pool = prophecyEvents.slice(0, 4);
    }
    const event = pool[Math.floor(Math.random() * pool.length)];
    currentProphecyEvent = event;

    // 3. 显示屏幕中间的警告大字
    const displayDiv = document.getElementById('event-display');
    
    // 强制样式确保可见 (修复假死问题的关键)
    displayDiv.style.zIndex = "300"; 
    displayDiv.style.top = '150px'; // 稍微往下一点
    displayDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    displayDiv.style.padding = '20px';
    displayDiv.style.borderRadius = '10px';
    displayDiv.style.pointerEvents = 'none'; // 允许点击穿透(可选)
    
    ui.eventTitle.innerText = "⚠️ 国师预言 ⚠️";
    ui.eventTitle.style.color = "#f0ad4e";
    ui.eventDesc.innerText = event.desc + "\n\n(30秒后触发)";
    
    ui.eventTitle.style.opacity = 1;
    ui.eventDesc.style.opacity = 1;

    // 4. 3秒后自动开始倒计时
    setTimeout(() => {
        // 隐藏中间大字
        ui.eventTitle.style.opacity = 0;
        ui.eventDesc.style.opacity = 0;
        
        // 恢复样式
        displayDiv.style.background = 'transparent';
        displayDiv.style.padding = '0';
        displayDiv.style.zIndex = "20"; // 恢复低层级
        displayDiv.style.top = '80px'; // 恢复顶部位置
        ui.eventTitle.style.color = ''; // 清除内联颜色，恢复默认

        // 进入倒计时模式
        startProphecyCountdown(); 
    }, 3000);
}

// --- 阶段2：预言开始倒计时 ---
function startProphecyCountdown() {
    if (!currentProphecyEvent) return;
    
    currentPhase = 'PROPHECY_ACTIVE';
    
    // UI 恢复
    hideMask();
    ui.idlePanel.style.display = 'block'; // 显示安史之乱倒计时
    ui.swipeCard.style.display = 'none';
    
    // 【新增】清空并隐藏标题和描述，防止残留
    ui.eventTitle.style.opacity = 0;
    ui.eventDesc.style.opacity = 0;
    ui.eventTitle.innerText = "";
    ui.eventDesc.innerText = "";

        // 【新增】恢复预言倒计时UI
    ui.sideUI.style.display = 'flex';
    document.getElementById('prophecy-panel').style.display = 'block'
    
    // 初始化倒计时状态
    prophecyState = {
        event: currentProphecyEvent,
        timer: currentProphecyEvent.duration
    };
    updateProphecyUI();
}


// --- 更新预言UI ---
function updateProphecyUI() {
    let panel = document.getElementById('prophecy-panel');

    // 【新增】如果面板不存在，或者当前处于非闲置状态（如招募、政务、危机），则隐藏
    if (!prophecyState || (currentPhase !== 'IDLE' && currentPhase !== 'PROPHECY_ACTIVE')) {
        if(panel) panel.style.display = 'none';
        return;
    }
     panel.style.display = 'flex';

    const event = prophecyState.event;
    const time = Math.ceil(prophecyState.timer);
    
    // 生成资源需求 HTML
    let reqHtml = `<img src="${RESOURCE_ICONS[event.require.type]}" style="width:14px;height:14px;vertical-align:middle"> ${event.require.count}`;
    if (event.require.type2) {
        reqHtml += `  +  <img src="${RESOURCE_ICONS[event.require.type2]}" style="width:14px;height:14px;vertical-align:middle"> ${event.require.count2}`;
    }

    /// 修改：倒计时文本改为 "倒计时 xx 秒"
    panel.innerHTML = `
        <div class="prophecy-bar">
            <div class="prophecy-name">⚠️ ${event.warningText}</div>
            <div class="prophecy-res">需: ${reqHtml}</div>
        </div>
        <div class="prophecy-timer-outside">倒计时 ${time} 秒</div>
    `;
}

// --- 阶段3：触发灾难结算 ---
function triggerProphecyResult() {
    const event = prophecyState.event;
    prophecyState = null; 
    updateProphecyUI(); 
    
    let success = false;
    const r1 = event.require;
    if (r1.type2) {
        if (resources[r1.type] >= r1.count && resources[r1.type2] >= r1.count2) success = true;
    } else {
        if (resources[r1.type] >= r1.count) success = true;
    }
    
    let title, desc;
    if (success) {
        title = "稍有损失";
        desc = event.successDesc;
        resources[r1.type] -= r1.count;
        if (r1.type2) resources[r1.type2] -= r1.count2;
        // 【新增】触发减少动画
        highlightRes(r1.type, false); 
        if(r1.type2) highlightRes(r1.type2, false);
        
        createFloatingText(window.innerWidth / 2, window.innerHeight / 3, r1.type, -r1.count); 
        if (r1.type2) createFloatingText(window.innerWidth / 2 + 50, window.innerHeight / 3, r1.type2, -r1.count2); 
    } else {
        title = "灾难降临";
        desc = event.failDesc;
        for (let k in event.failEffect) {
            resources[k] += event.failEffect[k];
            // 【新增】惩罚通常是负数，所以触发减少动画
            // 如果 failEffect 是负数，则减少；如果是正数（比如某些奇怪的事件加资源），则增加
            if(event.failEffect[k] < 0) highlightRes(k, false);
            else highlightRes(k, true);

            createFloatingText(window.innerWidth / 2, window.innerHeight / 3, k, event.failEffect[k]);
        }
    }
    
    updateUI();

    // 【修改】位置设为 110px
    const displayDiv = document.getElementById('event-display');
    displayDiv.style.top = '110px';
    displayDiv.style.background = 'rgba(0, 0, 0, 0.7)';
    displayDiv.style.padding = '15px';
    displayDiv.style.borderRadius = '8px';

    ui.eventTitle.innerText = title;
    ui.eventDesc.innerText = desc;
    ui.eventTitle.style.opacity = 1;
    ui.eventDesc.style.opacity = 1;

    setTimeout(() => {
        ui.eventTitle.style.opacity = 0;
        ui.eventDesc.style.opacity = 0;
        // 恢复样式
        displayDiv.style.top = '80px';
        displayDiv.style.background = 'transparent';
        displayDiv.style.padding = '0';
        displayDiv.style.borderRadius = '0';

         // 【新增】清除内联颜色样式，防止后续标题变色
        ui.eventTitle.style.color = ''; 
    }, 3000);
}

// 辅助函数：获取资源图标
function getResourceIcon(type) {
    const icons = { treasury: '💰', people: '👥', military: '🗡️', culture: '📜' };
    return icons[type] || '?';
}

// --- 新增：结算预言灾难 ---
function triggerProphecyDisaster() {
    const state = prophecyState;
    prophecyState = null; // 清除状态
    updateProphecyUI(); // 隐藏UI
    
    const event = state.event;
    let success = false;
    
    // 检查资源是否足够
    if (event.require.type2) {
        if (resources[event.require.type] >= event.require.count && 
            resources[event.require.type2] >= event.require.count2) {
            success = true;
        }
    } else {
        if (resources[event.require.type] >= event.require.count) {
            success = true;
        }
    }
    
    currentPhase = 'PROPHECY_RESULT';
    showMask();
    ui.swipeCard.style.display = 'flex';
    
    if (success) {
        // 扣除资源
        resources[event.require.type] -= event.require.count;
        if (event.require.type2) resources[event.require.type2] -= event.require.count2;
        
        ui.eventTitle.innerText = "有惊无险，渡过了此次劫难";
        ui.eventDesc.innerText = event.successDesc;
        // 显示简单的确认按钮
        ui.txtLeft.innerText = "虽有损失，但幸好早有准备";
        ui.txtRight.innerText = "虽有损失，但幸好早有准备";
    } else {
        // 惩罚
        for (let k in event.failEffect) resources[k] += event.failEffect[k];
        
        ui.eventTitle.innerText = "灾难降临，文明受到了影响";
        ui.eventDesc.innerText = event.failDesc;
        ui.txtLeft.innerText = "痛心疾首";
        ui.txtRight.innerText = "痛心疾首";
    }
    
    // 等待玩家点击确认后恢复 IDLE
    // 注意：这里复用了 handleChoice 的逻辑，点击后需要切回 IDLE
    // 在 handleChoice 中增加对 PROPHECY_RESULT 的处理
}

// --- 修改：触发政务事件 (原灾害) ---
function triggerGovernmentEvent() {
    specialEventCount++;
    pendingDisaster = true;
    
    const event = governmentEvents[Math.floor(Math.random() * governmentEvents.length)];
    
    // 【核心修复】必须使用 loadDeck 初始化，清空 nextCardId 等残留状态
    loadDeck(event.questions);
    
    // 【修复】确保右侧UI显示，然后显示政务按钮
    ui.sideUI.style.display = 'flex';
    
    const btn = document.getElementById('disaster-btn');
    btn.querySelector('div:last-child').innerText = "政务"; 
    btn.classList.add('show');
}


function handleGovernment() {
    if(!pendingDisaster) return;
    pendingDisaster = false;
    document.getElementById('disaster-btn').classList.remove('show');
    
    currentPhase = 'SPECIAL_EVENT';
    
    // 隐藏闲置面板和预言UI
    ui.idlePanel.style.display = 'none';
    document.getElementById('prophecy-panel').style.display = 'none';
    showMask();
    showNextCard();
}

function loadDeck(d) { currentDeck = d; cardMap = {}; currentDeck.forEach(c => cardMap[c.id] = c); nextCardId = currentDeck.length ? currentDeck[0].id : null; }
function gameLoop() { 
    let n = Date.now(), dt = (n - lastTime) / 1000; 
    lastTime = n; 

    // --- 1. 招募冷却 (独立逻辑) ---
    if (recruitSlots < 3) { 
        recruitTimer -= dt; 
        if (recruitTimer <= 0) { 
            recruitSlots++; 
            recruitTimer = RECRUIT_COOLDOWN; 
        } 
        updateRecruitUI(); 
    } 

    // --- 2. 游戏主逻辑 ---
    // 只要不是结局状态，时间就流动
    if (currentPhase !== 'CRISIS' && currentPhase !== 'GAME_OVER') {
        gameTime += dt; 
        
        // 倒计时计算 (总时长 300秒)
        let r = finalCountdown - gameTime;
        
        // UI 更新
        if (r > 0) ui.finalTimer.innerText = `安史之乱倒计时: ${Math.floor(r/60)}:${String(Math.floor(r%60)).padStart(2,'0')}`; 
        else ui.finalTimer.innerText = "安史之乱爆发！";

        // 背景变化
        if (r <= 180 && snowInterval) { returnToSpring(); }

        // 预言倒计时逻辑
         if (prophecyState && (currentPhase === 'IDLE' || currentPhase === 'PROPHECY_ACTIVE')) {
            prophecyState.timer -= dt;
            updateProphecyUI();
            if (prophecyState.timer <= 0) {
                triggerProphecyResult();
            }
        }
        // 气泡逻辑
        characters.forEach(char => {
            char.bubbleTimer += dt;
            if (char.bubbleTimer >= 15 && !char.hasBubble) {
                generateBubble(char);
            }
        });

        // --- 3. 人物移动逻辑 ---
        // 允许移动的状态：IDLE (闲置), PROPHECY_ACTIVE (倒计时中), CHAR_CREATION (招募中)
        // 禁止移动的状态：PROPHECY_WARNING (预言弹窗), SPECIAL_EVENT (政务弹窗), CRISIS
        if (currentPhase === 'IDLE' || currentPhase === 'PROPHECY_ACTIVE' || currentPhase === 'CHAR_CREATION') {
            updateCharacterPositions(dt); 
        }

        // --- 4. 事件触发检查 ---
        // 强制触发：时间到了就触发 (前提是当前没有弹窗干扰)
        // 只有 IDLE 状态下才弹窗，防止窗口重叠
        if (currentPhase === "IDLE") {
            
            // 270秒: 第一次预言
            if (r <= 270 && !triggeredEvents.prophecy1) {
                triggeredEvents.prophecy1 = true;
                triggerProphecyIntro(false);
            }

            // 210秒: 第一次政务
            if (r <= 210 && !triggeredEvents.gov1) {
                triggeredEvents.gov1 = true;
                triggerGovernmentEvent();
            }

            // 180秒: 第二次预言
            if (r <= 180 && !triggeredEvents.prophecy2) {
                triggeredEvents.prophecy2 = true;
                triggerProphecyIntro(false);
            }

            // 120秒: 第二次政务
            if (r <= 120 && !triggeredEvents.gov2) {
                triggeredEvents.gov2 = true;
                triggerGovernmentEvent();
            }

            // 60秒: 第三次预言 (强制双资源)
            if (r <= 60 && !triggeredEvents.prophecy3) {
                triggeredEvents.prophecy3 = true;
                triggerProphecyIntro(true);
            }
        }
        
        // 0秒: 游戏结束
        if (r <= 0) {
            startCrisis();
        }
    }
}

function applyIncome() { for (let k in resources) { resources[k] += incomeRates[k]; highlightRes(k, true); } updateUI(); let h = checkHighStatFail(); if (h) { showResult(false, h); clearInterval(gameLoopInterval); } }
function highlightRes(k, isIncrease) { 
    let valEl = ui.resValues[k]; 
    if(!valEl) return; 

    // 1. 清除该资源之前的计时器，防止高频点击导致动画提前结束
    if (highlightTimers[k]) {
        clearTimeout(highlightTimers[k]);
        highlightTimers[k] = null;
    }

    // 2. 移除所有状态类，重置动画
    valEl.classList.remove('res-increase', 'res-decrease', 'res-preview');
    
    // 3. 强制回流，确保浏览器认识到类名变化，允许动画重新触发
    void valEl.offsetWidth; 

    // 4. 添加新类
    if (isIncrease) {
        valEl.classList.add('res-increase');
    } else {
        valEl.classList.add('res-decrease');
    }

    // 5. 设置新的计时器，300ms 后移除类
    highlightTimers[k] = setTimeout(() => {
        valEl.classList.remove('res-increase', 'res-decrease');
        highlightTimers[k] = null;
    }, 300);
}

function clearGuessHighlight() { Object.values(ui.resValues).forEach(el => el.classList.remove('guess')); }
function checkHighStatFail() { 
    // 1. 检查是否超过 300 (失败条件)
    for (let k in resources) {
        if (resources[k] > 300) {
            if (k === 'military') return "军事值过高，穷兵黩武，百姓揭竿而起，文明结束。"; 
            if (k === 'culture') return "文化值过高，终日靡靡之音，不思进取，被外敌吞并。"; 
            if (k === 'treasury') return "粮仓爆满而无处存放，腐烂生变，引发大疫，文明结束。"; 
            if (k === 'people') return "科技畸形发展，资源枯竭，生态崩溃，文明结束。"; 
        }
    }

    // 2. 检查是否超过 250 
    // 遍历所有资源，分别判断，互不干扰
    ['treasury', 'people', 'military', 'culture'].forEach(k => {
        const el = ui.resValues[k];
        if (el) {
            if (resources[k] > 250) {
                el.classList.add('warning');
            } else {
                el.classList.remove('warning');
            }
        }
    });

    return null; 
}
function updateUI() { 
    const maxRes = 300; // 设定新的资源上限
    
    // 更新数值文本
    ui.resValues.treasury.innerText = Math.floor(resources.treasury); 
    ui.resValues.people.innerText = Math.floor(resources.people); 
    ui.resValues.military.innerText = Math.floor(resources.military); 
    ui.resValues.culture.innerText = Math.floor(resources.culture); 
    
    // 更新进度条 (CSS ID 分别为 bar-treasury, bar-people 等)
    // 注意：需要先在 cacheUIElements 或 ui 对象中获取这些 DOM，或者直接这里获取
    ['treasury', 'people', 'military', 'culture'].forEach(type => {
        const bar = document.getElementById(`bar-${type}`);
        if(bar) {
            let pct = (resources[type] / maxRes) * 100;
            if(pct > 100) pct = 100;
            bar.style.width = pct + '%';
        }
    });

    // 收入提示 (如果有的话)
    if(ui.incomeStats) {
        ui.incomeStats.innerHTML = `<span>💰 +${incomeRates.treasury.toFixed(0)}/15s</span><span>👥 +${incomeRates.people.toFixed(0)}/15s</span><span>⚔️ +${incomeRates.military.toFixed(0)}/15s</span><span>📜 +${incomeRates.culture.toFixed(0)}/15s</span>`; 
    }
}
// 更新招募按钮状态
function updateRecruitUI() {
    const btn = ui.recruitBtn;
    const overlay = document.getElementById('recruit-overlay');
    const timerText = document.getElementById('recruit-timer-text');
    
    // 更新文字
    ui.recruitStatus.innerText = `招募(${recruitSlots})`;
    
    // 激活状态：只要有槽位就激活
    const hasSlot = recruitSlots > 0;
    btn.classList.toggle('active', hasSlot);
    
    // 遮罩逻辑：
    // 只有当没有槽位时 (recruitSlots === 0)，才显示遮罩和倒计时
    if (hasSlot) {
        overlay.style.height = '0%';
        timerText.style.display = 'none';
    } else {
        // 没有槽位，显示冷却进度
        const pct = (recruitTimer / RECRUIT_COOLDOWN) * 100;
        overlay.style.height = `${pct}%`;
        overlay.style.display = 'block';
        
        timerText.innerText = Math.ceil(recruitTimer);
        timerText.style.display = 'block';
    }
}

// 这个函数以前是专门更新 SVG 的，现在可以合并逻辑，或者直接让它调用 updateRecruitUI
function updateRecruitRing() {
    updateRecruitUI(); // 直接复用
}

function triggerSpecialEvent() {
    specialEventCount++; // 【新增】计数增加
    pendingDisaster = true;
    
    // 随机选择一个灾害剧本
    const event = specialEvents[Math.floor(Math.random() * specialEvents.length)];
    
    // 【核心修复】将灾害剧本的卡片注册到 cardMap 中，解决 Card missing 问题
    event.questions.forEach(q => {
        cardMap[q.id] = q;
    });
    
    // 设置当前牌组和状态
    currentDeck = event.questions;
    currentCardIndex = 0;
    currentPhase = 'SPECIAL_EVENT';
    
    // 显示灾害按钮
    ui.disasterBtn.classList.add('show');
    
    // 【可选】如果你的设计是点击按钮才弹出卡片，请保留下面这行，否则删掉
    // 这里假设点击按钮后调用 showCard(currentDeck[0]);
    // 如果之前逻辑是自动弹出，这里可以直接调用：
    // showCard(currentDeck[0]); 
}


function startCrisis() {
    // 强制打断任何阶段
    currentPhase = 'CRISIS';
    
    // 1. 关闭建造面板、建造模式
    if (isBuildingMode) {
        isBuildingMode = false;
        selectedBuilding = null;
        document.getElementById('placement-ghost').style.display = 'none';
        closeBuildPanel();
    }
    
    // 2. 关闭政务按钮
    ui.disasterBtn.classList.remove('show');
    
    // 3. 隐藏预言倒计时 (如果正好在倒计时中)
    if(prophecyState) {
        prophecyState = null;
        updateProphecyUI();
    }

    // 4. 加载危机剧本
    loadDeck(crisisTree);
    
    // 5. UI 切换
    ui.idlePanel.style.display = 'none'; // 隐藏倒计时
    ui.sideUI.style.display = 'none';    // 隐藏侧边按钮
    ui.swipeCard.style.display = 'flex'; // 显示卡片
    showMask(); 
    
    // 显示第一张危机卡片
    showNextCard();
}

// 新增：冬去春来，停止下雪，背景还原
function returnToSpring() {
    // 1. 停止生成新雪花
    if (snowInterval) {
        clearInterval(snowInterval);
        snowInterval = null;
    }
    
    // 2. 背景切回原景 (透明度设为 1)
    const bgMask = document.getElementById('bg-mask');
    if (bgMask) {
        bgMask.style.opacity = 1;
    }
}

function handleDisaster() { 
       // 该函数已废弃，逻辑已移至 triggerGovernmentEvent
}
function checkGameFail() { if (resources.treasury <= 0) return "粮食见底，国库空虚，王朝溃散"; if (resources.people <= 0) return "科技值为0，文明太过落后，被外族入侵，王朝覆灭"; if (resources.military <= 0) return "军事值为0，军力薄弱，无力统治"; if (resources.culture <= 0) return "文化值为0，礼乐崩坏，内乱四起"; return null; }

function showNextCard() {

     // 【新增】进入卡片界面时，隐藏所有悬浮UI
    ui.sideUI.style.display = 'none';
    document.getElementById('prophecy-panel').style.display = 'none';

    if (nextCardId === "end_battle" || nextCardId === "end_flee") { calculateEnding(); return; }
    if (nextCardId === "end") {
        if (currentPhase === "POLICY") { startEvolution(); return; }
        if (currentPhase === "CHAR_CREATION") { finishCharacterCreation(); return; }
        if (currentPhase === "SPECIAL_EVENT") { finishSpecialEvent(); return; }
        return;
    }
    let c = nextCardId ? cardMap[nextCardId] : currentDeck[currentCardIndex];
    if (!c) { console.error("Card missing", nextCardId); if(currentPhase==="POLICY") startEvolution(); else finishCharacterCreation(); return; }

    showMask();
// 【新增】确保滑动区域是显示状态
    ui.swipeArea.style.display = 'flex'; 
    ui.eventTitle.innerText = c.title;
    // 每次显示新卡片前，强制清除内联颜色样式
    ui.eventTitle.style.color = ''; 
    
    // --- 修改：识别通用的随机结果后缀 ---
    // 如果 ID 以 _gamble_win 或 _gamble_lose 结尾，说明是随机结果
    if (c.id.endsWith("_gamble_win") || c.id.endsWith("_gamble_lose")) {
        // lastGambleData.text 包含了骰子点数信息，这里我们将它稍微润色一下
        // 去掉原本的“大/小”字眼，只保留点数，显得更像命运的审判
        let diceInfo = lastGambleData.text.split('，')[0]; 
        ui.eventDesc.innerText = `命运判词：${diceInfo}。\n\n` + c.desc;
    } else {
        ui.eventDesc.innerText = c.desc;
    }

     // 【核心修复】强制重置透明度，解决预言结算时文字消失的问题
    ui.eventTitle.style.opacity = 1;
    ui.eventDesc.style.opacity = 1;

    ui.txtLeft.innerText = c.left ? c.left.text : "...";
    ui.txtRight.innerText = c.right ? c.right.text : "...";

    ui.swipeCard.style.transition = 'none';
    ui.swipeCard.style.transform = 'translateX(0) rotate(0)';
    ui.swipeCard.offsetTop;
    ui.swipeCard.style.opacity = 1;

     // 【核心修复】必须显式设置 display 为 flex，否则如果之前被设为 none (如倒计时阶段)，卡片不会显示
    ui.swipeCard.style.display = 'flex'; 

    updateCardVisual(0);
}

// 全局变量：存储上次赌博的结果
let lastGambleData = { win: false, value: 0, text: "" };

function handleChoice(d) {
    // --- 1. 处理预言介绍确认 ---
    if (currentPhase === "PROPHECY_INTRO") {
        startProphecyCountdown();
        return true;
    }

    // --- 2. 处理灾难结算确认 ---
    if (currentPhase === "PROPHECY_RESULT") {
        currentPhase = 'IDLE';
        hideMask();
        ui.swipeCard.style.display = 'none';
        ui.eventTitle.style.opacity = 0;
        ui.eventDesc.style.opacity = 0;
        ui.eventTitle.innerText = "";
        ui.eventDesc.innerText = "";
        ui.idlePanel.style.display = 'block';
        ui.sideUI.style.display = 'flex'; // 恢复右侧UI
        return false; 
    }

    // --- 3. 优先处理 Intro 阶段 ---
    if (currentPhase === "INTRO") {
        startPolicyPhase();
        return true;
    }

    // --- 4. 获取卡片数据 ---
    let c = nextCardId ? cardMap[nextCardId] : currentDeck[currentCardIndex];
    if (!c) return false;
    let ch = d === 'left' ? c.left : c.right;
    if (!ch) return false;

    // --- 5. 处理赌博逻辑 ---
    if (ch.special === "gamble") {
        let dice1 = Math.floor(Math.random() * 6) + 1;
        let dice2 = Math.floor(Math.random() * 6) + 1;
        let total = dice1 + dice2;
        let isBig = total > 7;
        let playerBetBig = (d === 'left');
        let win = (playerBetBig === isBig);
        lastGambleData = {
            win: win,
            value: total,
            text: `骰子落定：${dice1} + ${dice2} = ${total}，【${isBig ? '大' : '小'}】！你${win ? '赢了' : '输了'}...`
        };
        nextCardId = win ? ch.winNext : ch.loseNext;
        return true; 
    }

    // --- 6. 正常处理政策/人物逻辑 ---
 if (currentPhase === "POLICY" || currentPhase === "SPECIAL_EVENT" || currentPhase === "CRISIS") {
        for (let k in ch.effect) {
            if (resources[k] !== undefined) {
                // 【修复】定义 val 变量
                let val = ch.effect[k];
                
                resources[k] += val;
                if (resources[k] < 0) resources[k] = 0;

                // 【修复】根据 val 的正负播放动画
                // val > 0 增加 -> 绿色
                // val < 0 减少 -> 红色
                highlightRes(k, val > 0);
            }
        }
        updateUI();
        
        let f = checkGameFail();
        if (f) { setTimeout(() => showResult(false, f), 300); clearInterval(gameLoopInterval); return true; }
        let h = checkHighStatFail();
        if (h) { setTimeout(() => showResult(false, h), 300); clearInterval(gameLoopInterval); return true; }

        // --- 核心修复：区分政务和政策的流程 ---
if (currentPhase === "SPECIAL_EVENT") {
            // 1. 优先检查显式结束
            if (ch.nextId === "end") {
                currentPhase = 'IDLE';
                pendingDisaster = false;
                setTimeout(() => {
                    ui.swipeCard.style.display = 'none';
                    // 【新增】显式隐藏标题和描述
                    ui.eventTitle.style.opacity = 0;
                    ui.eventDesc.style.opacity = 0;
                    ui.eventTitle.innerText = "";
                    ui.eventDesc.innerText = "";
                    hideMask();
                    ui.idlePanel.style.display = 'block';
                    ui.sideUI.style.display = 'flex';
                }, 500);
                return false;
            }

            // 2. 尝试获取下一张卡片
            let nextCard = null;
            if (ch.nextId) {
                nextCard = cardMap[ch.nextId];
            } else {
                currentCardIndex++;
                if (currentCardIndex < currentDeck.length) {
                    nextCard = currentDeck[currentCardIndex];
                }
            }

            // 3. 判定结果
            if (nextCard) {
                nextCardId = nextCard.id;
                return true;
            } else {
                // 没有下一张，结束
                currentPhase = 'IDLE';
                pendingDisaster = false;
                setTimeout(() => {
                    ui.swipeCard.style.display = 'none';
                    // 【新增】显式隐藏标题和描述
                    ui.eventTitle.style.opacity = 0;
                    ui.eventDesc.style.opacity = 0;
                    ui.eventTitle.innerText = "";
                    ui.eventDesc.innerText = "";
                    hideMask();
                    ui.idlePanel.style.display = 'block';
                    ui.sideUI.style.display = 'flex';
                }, 500);
                return false;
            }
        }
        
        // 政策/危机逻辑保持不变
        nextCardId = ch.nextId || null;
    }
    else if (currentPhase === "CHAR_CREATION") {
        for (let k in ch.effect) charScores[k] = (charScores[k] || 0) + ch.effect[k];
    }
    // --- 7. 推进剧情与处理结局 ---
    nextCardId = ch.nextId || null;
    
    // 处理结局节点
    if (nextCardId === "end") {
        
        // 1. 处理招募结局 (显示"大幕落下")
        if (currentPhase === "CHAR_CREATION") {
            if (ch.reward) {
                spawnCharacter(ch.reward.type, ch.reward.tier);
            } else {
                spawnCharacter('people', 'common');
            }
            charScores = {};
            
            // 【核心修复】显示结束语，延时后消失
            ui.eventTitle.innerText = "大幕落下"; 
            ui.eventDesc.innerText = `一段故事又出现在了这片土地上`;
            // 强制显示标题描述
            ui.eventTitle.style.opacity = 1;
            ui.eventDesc.style.opacity = 1;
            
            setTimeout(() => { 
                currentPhase = "IDLE"; 
                ui.swipeCard.style.display = 'none'; 
                ui.eventTitle.style.opacity = 0; 
                ui.eventDesc.style.opacity = 0; 
                ui.txtLeft.classList.remove('active'); 
                ui.txtRight.classList.remove('active'); 
                ui.idlePanel.style.display = 'block'; 
                updateRecruitUI(); 
                hideMask(); 
                ui.sideUI.style.display = 'flex'; // 【核心修复】恢复右侧UI（招募按钮）
            }, 800); 
            
            return false; // 返回 true，保持卡片状态直到 setTimeout 执行
        }

        // 2. 处理政策结局
        if (currentPhase === "POLICY") { startEvolution(); return; }
        
        // 3. 其他结局 (如危机)
        currentPhase = 'IDLE';
        setTimeout(() => {
            ui.swipeCard.style.display = 'none';
            ui.eventTitle.innerText = ''; 
            ui.eventDesc.innerText = '';
            hideMask();
            ui.idlePanel.style.display = 'flex';
            ui.sideUI.style.display = 'flex';
        }, 20); 
        
        return true;
    }

    if (!ch.nextId) currentCardIndex++;
    return true;
}

// 新增：刷新卡片显示内容
function refreshCard() {
   // 1. 如果是闲置状态，不显示卡片，直接返回
    if (currentPhase === 'IDLE') {
        ui.swipeCard.style.display = 'none';
        return;
    }

    // 2. 获取当前应该显示的卡片
    // 如果有 nextCardId，优先用它找（用于赌博结果、跳转等）
    // 否则用当前索引找
    let card = nextCardId ? cardMap[nextCardId] : currentDeck[currentCardIndex];

    // 3. 如果找到了卡片，更新UI
    if (card) {
        ui.eventTitle.innerText = card.title || '';
        ui.eventDesc.innerText = card.desc || '';
        ui.txtLeft.innerText = card.left ? card.left.text : '';
        ui.txtRight.innerText = card.right ? card.right.text : '';
        
        // 确保卡片显示
        ui.swipeCard.style.display = 'flex';
        
        // 清空 nextCardId，防止重复使用
        nextCardId = null; 
    } else {
        // 如果没卡片了，隐藏
        ui.swipeCard.style.display = 'none';
    }
}

function finishSpecialEvent() { ui.eventTitle.innerText = "事态平息"; ui.eventDesc.innerText = ""; 
    // 优化：灾害结束 2000ms -> 500ms
    setTimeout(() => { currentPhase = "IDLE"; ui.swipeCard.style.display = 'none'; ui.eventTitle.style.opacity = 0; ui.eventDesc.style.opacity = 0; ui.idlePanel.style.display = 'block'; hideMask(); }, 500); 
}

// --- 滑动逻辑 ---
let isDragging = false, startX = 0, currentX = 0; 
const THRESHOLD = 100;

function setupSwipeEvents() { 
    let c = ui.swipeCard; 
    const options = { passive: false };
    c.addEventListener('touchstart', e => { if(currentPhase!=="IDLE") dragStart(e); }, options);
    c.addEventListener('touchmove', e => { if(currentPhase!=="IDLE") drag(e); }, options);
    c.addEventListener('touchend', e => { if(currentPhase!=="IDLE") dragEnd(e); }, options);
    c.addEventListener('mousedown', e => { if(currentPhase!=="IDLE") dragStart(e); });
    document.addEventListener('mousemove', e => { if(currentPhase!=="IDLE") drag(e); });
    document.addEventListener('mouseup', e => { if(currentPhase!=="IDLE") dragEnd(e); });
}

function dragStart(e) { isDragging = true; startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; ui.swipeCard.style.transition = 'none'; }
function drag(e) { if (!isDragging) return; e.preventDefault(); currentX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - startX; ui.swipeCard.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`; updateCardVisual(currentX); }

function dragEnd(e) { 
    if (!isDragging) return; isDragging = false; 
    clearGuessHighlight(); 
    
    if (Math.abs(currentX) > THRESHOLD) { 
        let d = currentX > 0 ? 'right' : 'left'; 
        let flyX = (d === 'right' ? 500 : -500);
        ui.swipeCard.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in'; 
        ui.swipeCard.style.transform = `translateX(${flyX}px) rotate(${d === 'right' ? 20 : -20}deg)`; 
        ui.txtLeft.classList.remove('active');
        ui.txtRight.classList.remove('active');
        
        setTimeout(() => { ui.swipeCard.style.opacity = 0; }, 150);
        setTimeout(() => { 
            let needNextCard = handleChoice(d); 
            
            // 【核心修复】
            // 如果 handleChoice 处理成功，且当前不是“预言倒计时阶段”，才显示下一张卡片
            // 因为 handleChoice 处理预言介绍时，会把 currentPhase 改为 PROPHECY_ACTIVE，此时应该隐藏卡片而不是显示下一张
            if (needNextCard && currentPhase !== "INTRO" && currentPhase !== "PROPHECY_ACTIVE") { 
                showNextCard(); 
            } else {
                // 否则（比如进入倒计时、或者处理结束），确保清理 UI
                ui.txtLeft.classList.remove('active');
                ui.txtRight.classList.remove('active');
                // 如果进入倒计时，确保卡片隐藏（startProphecyCountdown 已处理，这里作为双保险）
                if (currentPhase === "PROPHECY_ACTIVE") {
                    ui.swipeCard.style.display = 'none';
                }
            }
        }, 200); 
    } else { 
        ui.swipeCard.style.transition = 'transform 0.3s ease-out'; 
        ui.swipeCard.style.transform = 'translateX(0) rotate(0)'; 
        updateCardVisual(0); 
    } 
    currentX = 0; 
}

// --- 核心视觉更新函数 ---
function updateCardVisual(x) { 
    let progress = Math.min(Math.abs(x) / THRESHOLD, 1);
    
    // 更新文字提示
    if (x < -10) { ui.txtLeft.classList.add('active'); ui.txtRight.classList.remove('active'); } 
    else if (x > 10) { ui.txtLeft.classList.remove('active'); ui.txtRight.classList.add('active'); } 
    else { ui.txtLeft.classList.remove('active'); ui.txtRight.classList.remove('active'); }

    // 更新进度条
    let widthPercent = progress * 100; 
    if (x < 0) { ui.barLeft.style.width = widthPercent + '%'; ui.barRight.style.width = '0%'; } 
    else if (x > 0) { ui.barLeft.style.width = '0%'; ui.barRight.style.width = widthPercent + '%'; } 
    else { ui.barLeft.style.width = '0%'; ui.barRight.style.width = '0%'; }

    // --- 核心修复逻辑 ---
    if (Math.abs(x) > 30 && currentPhase !== "INTRO") { 
        let c = nextCardId ? cardMap[nextCardId] : currentDeck[currentCardIndex]; 
        if(!c) return; 
        if (currentPhase === "POLICY" || currentPhase === "SPECIAL_EVENT" || currentPhase === "CRISIS") { 
            let eff = (x < 0) ? c.left.effect : c.right.effect; 
            
            // 遍历所有资源
            Object.keys(ui.resValues).forEach(k => {
                let el = ui.resValues[k];
                // 1. 先强制移除预览类
                el.classList.remove('res-preview');
                
                // 2. 如果资源受影响，添加预览类（橙色）
                if(eff && eff[k] !== undefined) {
                    el.classList.add('res-preview');
                }
            });
        } 
    } else { 
        // 当 x 接近 0 时（卡片重置或显示新卡片时）
        // 【关键】只清除预览类，不清除结果类
        // 这样 handleChoice 中添加的绿/红动画就能保留下来播放完
        Object.values(ui.resValues).forEach(el => {
             el.classList.remove('res-preview');
        });
    } 
}
function startEvolution() {
    currentPhase = "IDLE"; 
    ui.eventTitle.style.opacity = 0; 
    ui.eventDesc.style.opacity = 0; 
    ui.swipeCard.style.display = 'none'; 
    ui.swipeArea.style.display = 'none'; 
    // 【修改】确保这里使用 block，配合 CSS width:100% 实现居中
    ui.idlePanel.style.display = 'block'; 
    ui.sideUI.style.display = 'flex'; 
    recruitSlots = 2; recruitTimer = RECRUIT_COOLDOWN; updateRecruitUI(); 
    hideMask(); 
}
function tryStartRecruit() { 
    if (recruitSlots <= 0 || (currentPhase !== "IDLE" && currentPhase !== "PROPHECY_ACTIVE")) return; 

     // 【新增】开始招募时，强制隐藏预言面板
    let panel = document.getElementById('prophecy-panel');
    if(panel) panel.style.display = 'none';

    recruitSlots--; 
    updateRecruitUI(); 
    currentPhase = "CHAR_CREATION";

    // 【修改】按概率选择剧本
    // 剧本索引：0,1 为精英；2,3,4 为普通
    let eliteIndices = [0, 1];
    let commonIndices = [2, 3, 4];
    
    // 过滤掉上一次使用的剧本，避免连续重复
    let availableElite = eliteIndices.filter(i => i !== lastStoryIndex);
    let availableCommon = commonIndices.filter(i => i !== lastStoryIndex);
    
    // 如果备选池空了，重置
    if(availableElite.length === 0) availableElite = eliteIndices;
    if(availableCommon.length === 0) availableCommon = commonIndices;

    let selectedIndex;
    // 设定 20% 概率抽取精英剧本 (可自行调整 0.2)
    if (Math.random() < 0.2 && availableElite.length > 0) {
        selectedIndex = availableElite[Math.floor(Math.random() * availableElite.length)];
    } else {
        selectedIndex = availableCommon[Math.floor(Math.random() * availableCommon.length)];
    }

    const s = characterStories[selectedIndex];
    lastStoryIndex = selectedIndex;

    loadDeck(s.list); 
    nextCardId = s.list[0].id; 
    charScores = {}; 
    ui.swipeCard.style.display = 'flex'; 
    ui.eventTitle.style.opacity = 1; 
    ui.eventDesc.style.opacity = 1; 
    ui.idlePanel.style.display = 'none'; 
    ui.eventTitle.innerText = "命运的齿轮"; 
    ui.eventDesc.innerText = `【${s.name}】\n一段新的人生...`; 
    setTimeout(showNextCard, 500); 
}

function finishCharacterCreation() { 
    // 现在角色生成已经在 handleChoice 中通过 reward 字段完成了
    // 这里只需要清理数据并切换状态即可
    
    charScores = {}; // 清空评分
    
    ui.eventTitle.innerText = "大幕落下"; 
    ui.eventDesc.innerText = `一段故事又出现在了这片土地上`; 
    
    setTimeout(() => { 
        currentPhase = "IDLE"; 
        ui.swipeCard.style.display = 'none'; 
        ui.eventTitle.style.opacity = 0; 
        ui.eventDesc.style.opacity = 0; 
        ui.txtLeft.classList.remove('active'); 
        ui.txtRight.classList.remove('active'); 
        ui.idlePanel.style.display = 'block'; 
        updateRecruitUI(); 
        hideMask(); 
    }, 800); 
}

function calculateEnding() { 
    let w = false, t = ""; 
    
    // 逻辑保持不变，但确保 w = true 时代表成功存活
    if (nextCardId === "end_battle") { 
        if (resources.military >= 200 && resources.people >= 150) { 
            w = true; t = "御驾亲征，大破叛军！\n大唐国祚得以延续百年。"; 
        } else { 
            w = false; t = "军事和科技值不够。军心涣散，大败于敌，文明被毁之一旦。"; // 战败算失败
        } 
    } else if (nextCardId === "end_flee") { 
        if (resources.treasury >= 200 || resources.culture >= 150) { 
            w = true; t = "忍辱负重，退守蜀地，徐图后计。"; 
        } else { 
            w = false; t = "粮食和文化值不够。逃亡路上，禁军哗变，文明到此结束。"; 
        } 
    } 
    
    showResult(w, t); 
}

function spawnCharacter(type = 'people', tier = 'common') {
    const roleConfig = CHARACTER_ROLES[type];
    const qualityConfig = getQualityConfig(tier);
    
    if (!roleConfig) return;

    const tierConfig = roleConfig.tiers[tier];
    
    // 创建角色对象
    const charData = {
        id: Date.now() + Math.random(),
        type: type,
        tier: tier,
        name: tierConfig.name,
       icon: tierConfig.icon, // 【修改】从 tierConfig 读取图标
        bonus: tierConfig.bonus,
        isDouble: tierConfig.isDouble,
        qualityColor: qualityConfig.color,
        // 气泡计时器：每个角色独立计时，初始为0，或者给一个随机值避免同时生成
        bubbleTimer: Math.random() * 5, 
        hasBubble: false
    };

    characters.push(charData);
    renderCharacter(charData); // 渲染到页面
    updateRecruitUI();
}

// 渲染角色到场景
function renderCharacter(charData) {
    const el = document.createElement('div');
    el.className = 'character-unit';
    el.id = `char-${charData.id}`;
    
    let container = document.getElementById('buildings-container');
    if (!container) container = ui.swipeArea;
    
    const containerRect = container.getBoundingClientRect();
    
    charData.el = el; 
    charData.b = { w: containerRect.width, h: containerRect.height };
    charData.sp = 15 + Math.random() * 20; 
    
    // 位置计算：X轴左右留空，Y轴集中在屏幕中下部 (模拟近处)
    // 这里调整为 bottom: 10% - 40% 的区域
    charData.x = containerRect.width * 0.1 + Math.random() * (containerRect.width * 0.8);
    // y 是 top 值，越小越靠上(远)，越大越靠下(近)
    charData.y = containerRect.height * 0.5 + Math.random() * (containerRect.height * 0.3); 
    
    charData.tx = charData.x; 
    charData.ty = charData.y; 
    
    el.style.position = 'absolute';
    el.style.left = charData.x + 'px';
    el.style.top = charData.y + 'px';
    
    // 【核心修复】动态 Z-Index
    // top 值越大 -> 越靠近屏幕底部 -> 越近 -> Z-Index 应该越大
    // z-index 范围映射：top 50%~80% -> z 50~80
    let z = Math.floor( (charData.y / containerRect.height) * 100 );
    el.style.zIndex = z; 
    
    el.style.width = '60px';
    
    el.innerHTML = `
        <div class="char-avatar" style="border-color: ${charData.qualityColor}; box-shadow: 0 0 8px ${charData.qualityColor}">
            <img src="${charData.icon}" alt="${charData.name}">
        </div>
        <div class="char-info" style="color: ${charData.qualityColor}">${charData.name}</div>
        <div class="bubble-container" style="position:absolute; bottom:100%; left:50%; transform:translateX(-50%); width:0; overflow:visible; pointer-events:none; white-space: nowrap; display:flex; align-items:center; margin-bottom: 15px;"></div>
    `;
    
    el.onclick = () => collectBubble(charData.id);
    container.appendChild(el);
}

function updateCharacterPositions(dt) {
    characters.forEach(c => {
        if (!c.el) return;

        let dx = c.tx - c.x,
            dy = c.ty - c.y,
            ds = Math.sqrt(dx * dx + dy * dy);
        
        if (ds < 5) {
            // 【修改】限制移动范围在屏幕中央区域，与生成位置一致
            if (c.b) {
                c.tx = c.b.w * 0.1 + Math.random() * (c.b.w * 0.8);
                c.ty = c.b.h * 0.3 + Math.random() * (c.b.h * 0.3);
            }
        } else {
            c.x += (dx / ds) * c.sp * dt;
            c.y += (dy / ds) * c.sp * dt;
            if (c.el) {
                c.el.style.left = c.x + 'px';
                c.el.style.top = c.y + 'px';
            }
        }
    });
}

function showResult(w, t) { 
    ui.overlay.style.display = 'flex'; 
    
    // 如果是失败 (w=false)，不显示高分评级，或者显示 F
    if (!w) {
        ui.resultTitle.innerText = "【王朝覆灭】";
        ui.resultTitle.style.color = "#d9534f";
        ui.resultDesc.innerText = t + "\n\n(未撑到安史之乱，无评级)";
    } else {
        // 胜利/生存结局，计算分数
        const res = calculateScoreAndGrade();
        
        ui.resultTitle.innerText = `【最终评级：${res.grade}】`;
        
        // 根据评级设置颜色
        let color = '#fff';
        if(res.grade === 'S') color = '#ffd700'; // 金色
        else if(res.grade === 'A') color = '#c69c6d'; // 紫色/古铜
        else if(res.grade === 'B') color = '#4a90e2'; // 蓝色
        
        ui.resultTitle.style.color = color;
        
        ui.resultDesc.innerHTML = `
            <span style="font-size:16px; color:#ddd">${res.comment}</span><br><br>
            <div style="text-align:left; display:inline-block; font-size:12px; color:#aaa; background:rgba(255,255,255,0.1); padding:10px; border-radius:5px;">
                资源得分: <span style="color:#fff">${Math.floor(res.details.res)}</span><br>
                建筑得分: <span style="color:#fff">${res.details.build}</span> (${placedBuildings.length}座)<br>
                名士得分: <span style="color:#fff">${res.details.char}</span> (${characters.length}人)<br>
                生存奖励: <span style="color:#fff">200</span><br>
                <hr style="border:0; border-top:1px solid #555; margin:5px 0;">
                <span style="font-size:14px; font-weight:bold; color:${color}">总分: ${res.score}</span>
            </div>
            <br><br>
            <span style="font-size:12px; color:#888">${t}</span>
        `;
    }
}


function createSnowflake() {
    const flake = document.createElement('div');
    flake.classList.add('snowflake');
    
    // 1. 随机大小 (10px - 18px)
    const size = Math.random() * 8 + 10 + 'px';
    flake.style.fontSize = size;
    
    // 2. 随机位置 (left: 0% - 100%)
    // 确保是从屏幕水平方向随机位置开始
    flake.style.left = Math.random() * 100 + '%'; 
    
    // 3. 随机下落时间 (10秒 - 20秒)，数值越小下落越快
    const duration = Math.random() * 10 + 10;
    flake.style.animationDuration = duration + 's';
    
    // 4. 随机透明度
    flake.style.opacity = Math.random() * 0.4 + 0.4;

    // 5. 随机雪花符号
    const snowSymbols = ['❄', '❅', '❆', '✻', '✼']; 
    flake.innerText = snowSymbols[Math.floor(Math.random() * snowSymbols.length)];

    // 添加到游戏容器
    const container = document.getElementById('game-container');
    container.appendChild(flake);

    // 动画结束后移除
    setTimeout(() => {
        flake.remove();
    }, duration * 1000);
}

// 开启下雪
function startSnow() {
   	
    // 循环生成
    // 修改：将 setInterval 的返回值赋给全局变量
    snowInterval = setInterval(() => {
        createSnowflake();
    }, 800); 
}


// 生成气泡
function generateBubble(charData) {
    const charEl = document.getElementById(`char-${charData.id}`);
    if (!charEl) return;

    charData.hasBubble = true;
    const container = charEl.querySelector('.bubble-container');
    
    const bubble = document.createElement('div');
    bubble.className = 'resource-bubble bounce-animation';
    
    const urls = { 
        treasury: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/food.png', 
        people: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/tech.png', 
        military: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/army.png', 
        culture: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/culture1.png' 
    };

    const resKeys = Object.keys(charData.bonus);
    let bubbleHTML = '';
    
    resKeys.forEach(key => {
        const val = charData.bonus[key];
        bubbleHTML += `<span style="display:flex; align-items:center; margin:0 2px;"><img src="${urls[key]}" style="width:14px; height:14px;">+${val}</span>`;
    });

    bubble.innerHTML = bubbleHTML;
    bubble.style.background = `rgba(0,0,0,0.7)`;
    bubble.style.border = `2px solid ${charData.qualityColor}`;
    
    // 【新增】强制气泡本身居中
    bubble.style.position = 'absolute';
    bubble.style.transform = 'translateX(-50%)';
    bubble.style.left = '0'; // 相对于 width:0 的父容器
    
    container.innerHTML = ''; 
    container.appendChild(bubble);

    bubble.onclick = (e) => {
        e.stopPropagation(); 
        collectBubble(charData.id);
    };
}

// 收集气泡
function collectBubble(charId) {
    const charData = characters.find(c => c.id === charId);
    const charEl = document.getElementById(`char-${charId}`);
    
    // 1. 安全检查：如果没有数据、没有DOM、或者没有气泡，直接返回
    if (!charData || !charEl || !charData.hasBubble) return;

    // 2. 【关键】立即锁定状态 + 重置计时器
    // 必须在执行任何操作前重置，防止重复点击
    charData.hasBubble = false;
    charData.bubbleTimer = 0; 

    // 3. 增加资源
    for (let key in charData.bonus) {
        resources[key] += charData.bonus[key];

        // 【新增】播放绿色增加动画
        highlightRes(key, true);
    }
    updateUI();

    // 4. 播放消失动画并移除 DOM
    const bubble = charEl.querySelector('.resource-bubble');
    if (bubble) {
        // 先禁用点击，防止连点
        bubble.style.pointerEvents = 'none';
        
        // 简单粗暴的JS动画：上飘 + 消失
        let opacity = 1;
        let top = 0; // 相对偏移量
        const animate = () => {
            opacity -= 0.05;
            top -= 2; // 向上移动
            bubble.style.opacity = opacity;
            bubble.style.transform = `translateX(-50%) translateY(${top}px)`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                // 动画结束，彻底移除
                if(bubble.parentNode) bubble.parentNode.removeChild(bubble);
            }
        };
        // 开启动画
        requestAnimationFrame(animate);
    }
}

// --- 新增：建造系统核心逻辑 ---

// 1. 打开建造面板
function openBuildPanel() {
    if (currentPhase !== 'IDLE' && currentPhase !== 'PROPHECY_ACTIVE') return;
    renderBuildPanel();
    ui.buildPanel.classList.add('open');
}

// 2. 关闭建造面板
function closeBuildPanel() {
    ui.buildPanel.classList.remove('open');
}

// 3. 渲染建筑列表
// 3. 渲染建筑列表 (已修改：图标一致 + 唯一建造限制)
function renderBuildPanel() {
    ui.buildGrid.innerHTML = '';
    
    // 定义资源图片 URL (请确保这些链接与你顶部 UI 的一致)
    const resImgs = {
        treasury: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/food.png',
        people: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/tech.png',
        military: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/army.png',
        culture: 'https://cdn.jsdelivr.net/gh/LuoshuiCat/demo@main/assets/culture1.png'
    };
    
    BUILDING_CATALOG.forEach(b => {
        // 检查资源是否足够
        const canAfford = resources[b.cost.type] >= b.cost.val;
        
        // 检查是否已经建造过 (新增逻辑)
        const isBuilt = placedBuildings.some(pb => pb.id === b.id);
        
        const div = document.createElement('div');
        // 如果已建造，添加 disabled 类
        div.className = `build-item ${canAfford && !isBuilt ? '' : 'disabled'}`;
        
        // 构建提示文字
        let statusText = "";
        if (isBuilt) statusText = "(已建造)";
        else if (!canAfford) statusText = "(资源不足)";

        div.innerHTML = `
            <img src="${b.icon}" class="build-icon-img">
            <div class="build-name">${b.name}</div>
            <div class="build-effect-row">
                <span class="build-cost">
                    <img src="${resImgs[b.cost.type]}" class="build-res-icon">-${b.cost.val}
                </span>
                <span class="build-gain">
                    <img src="${resImgs[b.gain.type]}" class="build-res-icon">+${b.gain.val}
                </span>
            </div>
            ${statusText ? `<div style="font-size:8px;color:#aaa">${statusText}</div>` : ''}
        `;
        
        // 只有没建过且买得起时，才能拖拽
        if(canAfford && !isBuilt) {
            div.onmousedown = (e) => startBuildingDrag(e, b);
            div.ontouchstart = (e) => startBuildingDrag(e, b);
        }
        
        ui.buildGrid.appendChild(div);
    });
}

// 4. 开始拖拽建筑
function startBuildingDrag(e, buildingData) {
    e.preventDefault();
    isBuildingMode = true;
    selectedBuilding = buildingData;
    closeBuildPanel(); // 拖拽开始时关闭面板
    
    // 初始化虚影
    const ghost = document.getElementById('placement-ghost');
    document.getElementById('ghost-img').src = buildingData.icon;
    ghost.style.display = 'flex';
    ghost.className = ''; // 重置 valid/invalid 类
    
    handleBuildingDrag(e); // 立即更新一次位置
}

// 5. 处理拖拽过程 (移动虚影 & 碰撞检测)
function handleBuildingDrag(e) {
    if (!isBuildingMode || !selectedBuilding) return;
    e.preventDefault();
    
    let clientX, clientY;
    if (e.type.includes('touch')) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const ghost = document.getElementById('placement-ghost');
    const ghostW = 50; 
    const ghostH = 50;
    const containerRect = ui.buildingsContainer.getBoundingClientRect();
    
    // 计算相对于容器的坐标
    let x = clientX - containerRect.left - ghostW / 2;
    let y = clientY - containerRect.top - ghostH / 2;
    
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    
    // 碰撞检测
    const isValid = checkCollision(x, y, ghostW, ghostH, containerRect.width, containerRect.height);
    
    if (isValid) {
        ghost.classList.add('valid');
        ghost.classList.remove('invalid');
    } else {
        ghost.classList.add('invalid');
        ghost.classList.remove('valid');
    }
}

// 6. 碰撞检测算法 (已修改：放宽可建造区域)
function checkCollision(x, y, w, h, containerW, containerH) {
    // 1. 边界检测
    // 【修改】将 y < containerH * 0.15 改为 y < containerH * 0.05
    // 允许建筑摆放在更靠上的位置，只要不遮挡顶部UI即可
    if (y < containerH * 0.05) return false; 
    
    // 左右边界
    if (x < 0 || x + w > containerW) return false;
    // 底部边界 (允许摆放到稍微靠下的位置，反正有 padding)
    if (y + h > containerH) return false;

    // 2. 建筑间重叠检测 (保持不变)
    for (let b of placedBuildings) {
        let bx = (b.x / 100) * containerW;
        let by = (b.y / 100) * containerH;
        let bw = (b.w / 100) * containerW;
        let bh = (b.h / 100) * containerH;
        
        const padding = 2; 
        if (x < bx + bw + padding &&
            x + w > bx - padding &&
            y < by + bh + padding &&
            y + h > by - padding) {
            return false;
        }
    }
    return true;
}

// 7. 放置建筑 (已修改：记录ID + 修复飘字位置)
// 7. 放置建筑 (已修改：记录ID + 修复飘字位置 + 防误触)
function placeBuilding(e) {
    if (!isBuildingMode || !selectedBuilding) return;
    
    const ghost = document.getElementById('placement-ghost');
    
    if (ghost.classList.contains('valid')) {
        // 【新增】开启锁，阻止紧接着的 click 事件
        suppressNextClick = true;

        const containerRect = ui.buildingsContainer.getBoundingClientRect();
        
        // 获取像素坐标
        const xPx = parseFloat(ghost.style.left);
        const yPx = parseFloat(ghost.style.top);
        
        // 转换为百分比
        const posData = {
            id: selectedBuilding.id,
            x: (xPx / containerRect.width) * 100,
            y: (yPx / containerRect.height) * 100,
            w: (50 / containerRect.width) * 100,
            h: (50 / containerRect.height) * 100
        };
        
        // 缓存数据
        const costType = selectedBuilding.cost.type;
        const costVal = selectedBuilding.cost.val;
        const gainType = selectedBuilding.gain.type;
        const gainVal = selectedBuilding.gain.val;

        placedBuildings.push(posData);
        
        // 更新资源
        resources[costType] -= costVal;
        resources[gainType] += gainVal;

        // 播放动画
        highlightRes(costType, false);
        highlightRes(gainType, true);

        updateUI();
        
        // 创建 DOM
        createBuildingDOM(selectedBuilding, posData);
        
        // 飘字逻辑 (使用了修复后的函数)
        let centerX = containerRect.left + xPx + 25; 
        let centerY = containerRect.top + yPx; 

        createFloatingText(centerX , centerY, costType, -costVal, 1000);
        createFloatingText(centerX , centerY-25, gainType, gainVal, 1000);

        // 检查失败条件
        let h = checkHighStatFail();
        if (h) { setTimeout(() => showResult(false, h), 300); clearInterval(gameLoopInterval); }
    }
    
    isBuildingMode = false;
    selectedBuilding = null;
    ghost.style.display = 'none';
}
// --- 补充缺失的函数：创建建筑 DOM ---
function createBuildingDOM(data, pos) {
    const div = document.createElement('div');
    div.className = 'building';
    
    // 设置建筑的内容：图标 + 名字
    div.innerHTML = `<div class="building-icon"><img src="${data.icon}"></div><span>${data.name}</span>`;
    
    // 根据 Y 轴位置计算层级（z-index）和缩放（近大远小）
    // pos.y 是 0~100 的百分比
    const zIndex = Math.floor(pos.y); 
    let scale = 0.8 + ((pos.y - 30) / 60) * 0.4; 

    // 设置样式
    div.style.left = pos.x + '%';
    div.style.top = pos.y + '%';
    div.style.zIndex = zIndex;
    div.style.transform = `scale(${scale})`;
    
    // 添加到场景容器中
    ui.buildingsContainer.appendChild(div);
}


// --- 结局评分系统 ---
function calculateScoreAndGrade() {
    // 1. 计算各项得分
    // 资源分：当前所有资源总和 (权重 1)
    const totalRes = resources.treasury + resources.people + resources.military + resources.culture;
    const scoreRes = totalRes * 1.5; 

    // 建筑分：已建造的建筑数量 (每个 30 分)
    const scoreBuild = placedBuildings.length * 30;

    // 人口分：招募的角色数量 (每个 50 分)
    const scoreChar = characters.length * 50;
    
    // 存活奖励 (能玩到最后没死)
    const scoreSurvival = 50;

    // 总分
    const totalScore = Math.floor(scoreRes + scoreBuild + scoreChar + scoreSurvival);

    // 2. 判定评级
    let grade = 'C';
    let comment = "乱世浮萍，勉强生存。";
    
    if (totalScore >= 2000) {
        grade = 'S';
        comment = "千古一帝，万世传颂！大唐盛世因你而辉煌！";
    } else if (totalScore >= 1500) {
        grade = 'A';
        comment = "中兴之主，国富民强。";
    } else if (totalScore >= 1000) {
        grade = 'B';
        comment = "中庸之君，不过不失。";
    }

    return { score: totalScore, grade: grade, comment: comment, details: {res: scoreRes, build: scoreBuild, char: scoreChar} };
}

initGame();