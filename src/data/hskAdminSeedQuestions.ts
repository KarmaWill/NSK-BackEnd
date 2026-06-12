import type { HskQuestionRow } from '../types/hskExams';

/** 与 5174 端 QuestionList / mockData.questions 对齐的 50 道样例题 */
export const HSK_ADMIN_SEED_QUESTIONS: HskQuestionRow[] = [
  {
    "question_uid": "Q-001",
    "type_id": "R07",
    "level": "HSK1",
    "tags": [
      "单选题"
    ],
    "stem": "「你好」的意思是？",
    "options": [
      {
        "label": "A",
        "text": "Hello"
      },
      {
        "label": "B",
        "text": "Goodbye"
      },
      {
        "label": "C",
        "text": "Thank you"
      },
      {
        "label": "D",
        "text": "Sorry"
      }
    ],
    "correctAnswer": "A",
    "explanation": "「你好」是中文中最基本的问候语，意思是\"Hello\"。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第1课"
    ],
    "linked_papers": [
      "HSK1 基础测试卷",
      "日常问候专项练习"
    ],
    "linked_videos": [
      "第1课 — 日常问候"
    ],
    "status": "published",
    "createdAt": "2025-12-01T08:00:00.000Z",
    "updatedAt": "2026-02-10T14:00:00.000Z"
  },
  {
    "question_uid": "Q-002",
    "type_id": "R08",
    "level": "HSK1",
    "tags": [
      "判断题"
    ],
    "stem": "「谢谢」是一种感谢的表达方式。",
    "options": [
      {
        "label": "正确",
        "text": "正确"
      },
      {
        "label": "错误",
        "text": "错误"
      }
    ],
    "correctAnswer": "正确",
    "explanation": "「谢谢」确实用于表达感谢。",
    "score": 1,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第1课"
    ],
    "linked_papers": [
      "HSK1 基础测试卷"
    ],
    "linked_videos": [],
    "status": "pending_review",
    "createdAt": "2025-12-02T08:00:00.000Z",
    "updatedAt": "2025-12-02T08:00:00.000Z"
  },
  {
    "question_uid": "Q-003",
    "type_id": "R07",
    "level": "HSK1",
    "tags": [
      "单选题"
    ],
    "stem": "「我叫小明」中「叫」的意思是？",
    "options": [
      {
        "label": "A",
        "text": "to call / to be called"
      },
      {
        "label": "B",
        "text": "to shout"
      },
      {
        "label": "C",
        "text": "to ask"
      },
      {
        "label": "D",
        "text": "to sing"
      }
    ],
    "correctAnswer": "A",
    "explanation": "「叫」在这里表示\"称呼、名叫\"的意思。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第2课"
    ],
    "linked_papers": [
      "HSK1 基础测试卷"
    ],
    "linked_videos": [
      "第2课 — 自我介绍"
    ],
    "status": "published",
    "createdAt": "2025-12-03T08:00:00.000Z",
    "updatedAt": "2026-01-20T09:00:00.000Z"
  },
  {
    "question_uid": "Q-004",
    "type_id": "R03",
    "level": "HSK2",
    "tags": [
      "填空题"
    ],
    "stem": "请填入合适的词语：这个苹果 5 元，那个苹果 3 元，那个苹果比这个 _______。",
    "options": [],
    "correctAnswer": "便宜",
    "explanation": "根据上下文，3元比5元价格更低，所以填\"便宜\"。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第3课"
    ],
    "linked_papers": [
      "HSK2 综合测试卷"
    ],
    "linked_videos": [
      "第3课 — 购物对话"
    ],
    "status": "pending_publish",
    "createdAt": "2025-12-05T08:00:00.000Z",
    "updatedAt": "2025-12-05T08:00:00.000Z"
  },
  {
    "question_uid": "Q-005",
    "type_id": "W04",
    "level": "HSK2",
    "tags": [
      "简答题"
    ],
    "stem": "请用中文写一段购物对话，至少包含 4 句对话。",
    "options": [],
    "correctAnswer": "",
    "explanation": "参考答案：A: 你好，这个多少钱？B: 这个十块钱。A: 太贵了，便宜一点吧。B: 那八块钱吧。A: 好，给你。B: 谢谢。",
    "score": 5,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第3课"
    ],
    "linked_papers": [
      "HSK2 综合测试卷"
    ],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2025-12-06T08:00:00.000Z",
    "updatedAt": "2026-01-05T10:00:00.000Z"
  },
  {
    "question_uid": "Q-006",
    "type_id": "R07",
    "level": "HSK3",
    "tags": [
      "多选题"
    ],
    "stem": "以下哪些是表示时间的词语？（多选）",
    "options": [
      {
        "label": "A",
        "text": "昨天"
      },
      {
        "label": "B",
        "text": "漂亮"
      },
      {
        "label": "C",
        "text": "明天"
      },
      {
        "label": "D",
        "text": "跑步"
      },
      {
        "label": "E",
        "text": "现在"
      }
    ],
    "correctAnswer": "A,C,E",
    "explanation": "「昨天」「明天」「现在」都是时间词语，「漂亮」是形容词，「跑步」是动词。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第4课"
    ],
    "linked_papers": [
      "HSK3 进阶测试卷"
    ],
    "linked_videos": [
      "第4课 — 时间表达"
    ],
    "status": "pending_review",
    "createdAt": "2025-12-10T08:00:00.000Z",
    "updatedAt": "2025-12-10T08:00:00.000Z"
  },
  {
    "question_uid": "Q-007",
    "type_id": "R07",
    "level": "HSK2",
    "tags": [
      "单选题"
    ],
    "stem": "在餐厅里，「买单」的意思是？",
    "options": [
      {
        "label": "A",
        "text": "Buy a menu"
      },
      {
        "label": "B",
        "text": "Pay the bill"
      },
      {
        "label": "C",
        "text": "Order food"
      },
      {
        "label": "D",
        "text": "Take away"
      }
    ],
    "correctAnswer": "B",
    "explanation": "「买单」粤语传入，在餐厅中表示结账付款。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第4课"
    ],
    "linked_papers": [
      "HSK2 综合测试卷"
    ],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2025-12-12T08:00:00.000Z",
    "updatedAt": "2025-12-12T08:00:00.000Z"
  },
  {
    "question_uid": "Q-008",
    "type_id": "R08",
    "level": "HSK1",
    "tags": [
      "判断题"
    ],
    "stem": "中文的基本语序是\"主语 + 谓语 + 宾语\"（SVO）。",
    "options": [
      {
        "label": "正确",
        "text": "正确"
      },
      {
        "label": "错误",
        "text": "错误"
      }
    ],
    "correctAnswer": "正确",
    "explanation": "中文语序确实为 SVO（主谓宾），与英语相同。",
    "score": 1,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第1课"
    ],
    "linked_papers": [
      "HSK1 基础测试卷"
    ],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2025-12-15T08:00:00.000Z",
    "updatedAt": "2025-12-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-009",
    "type_id": "R03",
    "level": "HSK3",
    "tags": [
      "填空题"
    ],
    "stem": "今天天气很热，我想喝一杯 _______ 的水。",
    "options": [],
    "correctAnswer": "冰",
    "explanation": "天热想喝冰水，\"冰\"表示冰冷。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第6课"
    ],
    "linked_papers": [
      "HSK3 进阶测试卷"
    ],
    "linked_videos": [],
    "status": "draft",
    "createdAt": "2026-02-01T08:00:00.000Z",
    "updatedAt": "2026-02-01T08:00:00.000Z"
  },
  {
    "question_uid": "Q-010",
    "type_id": "L03",
    "level": "HSK2",
    "tags": [
      "听力题",
      "单选题"
    ],
    "stem": "🔊 请听录音，选择你听到的句子。",
    "options": [
      {
        "label": "A",
        "text": "你好，我叫小明。"
      },
      {
        "label": "B",
        "text": "你好，我叫小红。"
      },
      {
        "label": "C",
        "text": "你好，你叫什么？"
      }
    ],
    "correctAnswer": "A",
    "explanation": "录音中说的是\"你好，我叫小明\"。",
    "score": 3,
    "audioStatus": "pending",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第1课"
    ],
    "linked_papers": [
      "HSK2 综合测试卷"
    ],
    "linked_videos": [
      "第1课 — 日常问候"
    ],
    "status": "published",
    "createdAt": "2026-02-15T08:00:00.000Z",
    "updatedAt": "2026-02-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-011",
    "type_id": "L01",
    "level": "HSK1",
    "tags": [
      "听力题",
      "单选题",
      "图片题"
    ],
    "stem": "🔊 请听录音，选择与录音内容相符的图片。",
    "options": [
      {
        "label": "A",
        "text": "图片A"
      },
      {
        "label": "B",
        "text": "图片B"
      },
      {
        "label": "C",
        "text": "图片C"
      }
    ],
    "correctAnswer": "A",
    "explanation": "录音说的是\"猫\"，对应图片A。",
    "score": 2,
    "audioStatus": "tts_ready",
    "imageStatus": "ready",
    "linked_courses": [
      "初级入门 · 第1课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-012",
    "type_id": "L01",
    "level": "HSK2",
    "tags": [
      "听力题",
      "单选题",
      "图片题"
    ],
    "stem": "🔊 请听录音，选择与录音内容相符的图片。",
    "options": [
      {
        "label": "A",
        "text": "图片A"
      },
      {
        "label": "B",
        "text": "图片B"
      },
      {
        "label": "C",
        "text": "图片C"
      }
    ],
    "correctAnswer": "A",
    "explanation": "录音描述了苹果和香蕉，对应图片A。",
    "score": 2,
    "audioStatus": "tts_ready",
    "imageStatus": "ready",
    "linked_courses": [
      "初级入门 · 第3课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-013",
    "type_id": "L02",
    "level": "HSK1",
    "tags": [
      "听力题",
      "匹配题",
      "图片题",
      "多题"
    ],
    "stem": "🔊 请听对话，将每个人物与他们喜欢的食物匹配起来。",
    "correctAnswer": "sq1:img1,sq2:img2,sq3:img3",
    "explanation": "根据录音，小明→苹果，小红→香蕉，小刚→西瓜。",
    "score": 3,
    "audioStatus": "tts_ready",
    "imageStatus": "ready",
    "linked_courses": [
      "初级入门 · 第3课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-014",
    "type_id": "L02",
    "level": "HSK2",
    "tags": [
      "听力题",
      "匹配题",
      "图片题",
      "多题"
    ],
    "stem": "🔊 请听对话，将人物与他们的职业匹配起来。",
    "correctAnswer": "sq1:img1,sq2:img2,sq3:img3",
    "explanation": "根据录音，张先生→老师，李女士→医生，王先生→厨师。",
    "score": 3,
    "audioStatus": "tts_ready",
    "imageStatus": "ready",
    "linked_courses": [
      "初级入门 · 第4课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-015",
    "type_id": "L03",
    "level": "HSK1",
    "tags": [
      "听力题",
      "单选题"
    ],
    "stem": "🔊 请听短句，选择正确的回答。",
    "options": [
      {
        "label": "A",
        "text": "你好！"
      },
      {
        "label": "B",
        "text": "再见！"
      },
      {
        "label": "C",
        "text": "谢谢！"
      }
    ],
    "correctAnswer": "A",
    "explanation": "听到\"你好\"，最合适的回应也是\"你好\"。",
    "score": 2,
    "audioStatus": "tts_ready",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第1课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-016",
    "type_id": "L03",
    "level": "HSK2",
    "tags": [
      "听力题",
      "单选题"
    ],
    "stem": "🔊 请听短句，选择正确的回答。",
    "options": [
      {
        "label": "A",
        "text": "一直往前走，然后左转。"
      },
      {
        "label": "B",
        "text": "这个苹果五块钱。"
      },
      {
        "label": "C",
        "text": "我叫小明。"
      }
    ],
    "correctAnswer": "A",
    "explanation": "录音问的是\"书店怎么走\"，A选项给出了方向指引。",
    "score": 2,
    "audioStatus": "tts_ready",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第5课"
    ],
    "linked_papers": [],
    "linked_videos": [
      "第5课 — 问路指路"
    ],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-017",
    "type_id": "L04",
    "level": "HSK3",
    "tags": [
      "听力题",
      "单选题"
    ],
    "stem": "🔊 请听对话，选择正确的答案。",
    "options": [
      {
        "label": "A",
        "text": "两百块"
      },
      {
        "label": "B",
        "text": "一百五十块"
      },
      {
        "label": "C",
        "text": "一百块"
      },
      {
        "label": "D",
        "text": "五十块"
      }
    ],
    "correctAnswer": "B",
    "explanation": "男子最后说\"一百五\"，即150元。",
    "score": 3,
    "audioStatus": "tts_ready",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第3课"
    ],
    "linked_papers": [],
    "linked_videos": [
      "第3课 — 购物对话"
    ],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-018",
    "type_id": "L04",
    "level": "HSK3",
    "tags": [
      "听力题",
      "单选题"
    ],
    "stem": "🔊 请听对话，选择正确的答案。",
    "options": [
      {
        "label": "A",
        "text": "两碗面条"
      },
      {
        "label": "B",
        "text": "一碗饺子"
      },
      {
        "label": "C",
        "text": "两碗饺子"
      },
      {
        "label": "D",
        "text": "米饭和菜"
      }
    ],
    "correctAnswer": "C",
    "explanation": "男子对服务员说\"来两碗饺子\"。",
    "score": 3,
    "audioStatus": "tts_ready",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第4课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-019",
    "type_id": "R01",
    "level": "HSK1",
    "tags": [
      "阅读题",
      "匹配题",
      "图片题"
    ],
    "stem": "请将图片与对应的文字描述匹配起来。",
    "correctAnswer": "s1:img1,s2:img2,s3:img3",
    "explanation": "太阳(s1→img1)，月亮(s2→img2)，星星(s3→img3)。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "ready",
    "linked_courses": [
      "初级入门 · 第1课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-020",
    "type_id": "R01",
    "level": "HSK2",
    "tags": [
      "阅读题",
      "匹配题",
      "图片题"
    ],
    "stem": "请将图片与对应的动作描述匹配起来。",
    "correctAnswer": "s1:img1,s2:img2,s3:img3",
    "explanation": "跑步(s1→img1)，游泳(s2→img2)，看书(s3→img3)。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "ready",
    "linked_courses": [
      "初级入门 · 第2课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-021",
    "type_id": "R02",
    "level": "HSK2",
    "tags": [
      "阅读题",
      "匹配题"
    ],
    "stem": "请将问题与对应的答案匹配起来（有一个多余答案）。",
    "correctAnswer": "q1:a1,q2:a2,q3:a3",
    "explanation": "a4是干扰项，\"我喜欢吃苹果\"不与任何问题匹配。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第2课"
    ],
    "linked_papers": [],
    "linked_videos": [
      "第2课 — 自我介绍"
    ],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-022",
    "type_id": "R02",
    "level": "HSK3",
    "tags": [
      "阅读题",
      "匹配题"
    ],
    "stem": "请将问题与对应的答案匹配起来（有一个多余答案）。",
    "correctAnswer": "q1:a1,q2:a2,q3:a3",
    "explanation": "a4是干扰项，\"这本书很好看\"不与任何问题匹配。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第6课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-023",
    "type_id": "R03",
    "level": "HSK2",
    "tags": [
      "阅读题",
      "填空题",
      "词语题",
      "多题"
    ],
    "stem": "请从词库中选择合适的词语填入每个句子的空白处。",
    "correctAnswer": "喜欢,高兴,好吃",
    "explanation": "词库中有4个词，需要使用3个。干扰词\"漂亮\"不匹配任何句子。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第3课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-024",
    "type_id": "R03",
    "level": "HSK3",
    "tags": [
      "阅读题",
      "填空题",
      "词语题",
      "多题"
    ],
    "stem": "请从词库中选择合适的词语填入每个句子的空白处。",
    "correctAnswer": "医院,超市,学校,公园",
    "explanation": "词库中有5个词，使用4个。干扰词\"图书馆\"不匹配任何句子。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第5课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-025",
    "type_id": "R04",
    "level": "HSK2",
    "tags": [
      "阅读题",
      "排序题"
    ],
    "stem": "请将以下词语片段排列成正确的句子。",
    "correctAnswer": "seg1,seg4,seg3,seg2",
    "explanation": "中文语序：主语 + 动词 + 宾语。\"我喜欢吃中国菜\"。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第1课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-026",
    "type_id": "R04",
    "level": "HSK3",
    "tags": [
      "阅读题",
      "排序题"
    ],
    "stem": "请将以下词语片段排列成正确的句子。",
    "correctAnswer": "seg3,seg2,seg5,seg1,seg4",
    "explanation": "主语 + 连词 + 同伴 + 时间 + 动作。\"我和朋友明天去公园\"。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第4课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-027",
    "type_id": "W01",
    "level": "HSK2",
    "tags": [
      "书写题",
      "匹配题",
      "部件题",
      "汉字题"
    ],
    "stem": "请将左边的部件与右边的部件组合成正确的汉字，并写出拼音。",
    "correctAnswer": "女+子:好,日+月:明,木+木:林",
    "explanation": "女+子=好(hǎo)，日+月=明(míng)，木+木=林(lín)。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第2课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-028",
    "type_id": "W01",
    "level": "HSK3",
    "tags": [
      "书写题",
      "匹配题",
      "部件题",
      "汉字题"
    ],
    "stem": "请将左边的部件与右边的部件组合成正确的汉字，并写出拼音。",
    "correctAnswer": "口+巴:吧,氵+可:河,扌+戈:找",
    "explanation": "口+巴=吧(ba)，氵+可=河(hé)，扌+戈=找(zhǎo)。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第3课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-029",
    "type_id": "W02",
    "level": "HSK2",
    "tags": [
      "书写题",
      "填空题",
      "汉字题"
    ],
    "stem": "请根据拼音提示在空白处填写正确的汉字。",
    "correctAnswer": "上,好,朋",
    "explanation": "早上(shàng)，好看(hǎo)，朋友(péng)。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第2课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-030",
    "type_id": "W02",
    "level": "HSK3",
    "tags": [
      "书写题",
      "填空题",
      "汉字题"
    ],
    "stem": "请根据拼音提示在空白处填写正确的汉字。",
    "correctAnswer": "气,想,咸,上",
    "explanation": "天气(qì)，想(xiǎng)，咸(xián)，关上(shàng)。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第6课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-031",
    "type_id": "W04",
    "level": "HSK3",
    "tags": [
      "书写题",
      "写作题",
      "文本输入",
      "AI评分"
    ],
    "stem": "请根据以下话题和关键词写一篇短文。",
    "correctAnswer": "",
    "explanation": "评分标准：内容完整(40分)、语法正确(30分)、字数达标(30分)，共100分。",
    "score": 10,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第4课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-032",
    "type_id": "W04",
    "level": "HSK4",
    "tags": [
      "书写题",
      "写作题",
      "文本输入",
      "AI评分"
    ],
    "stem": "请根据以下话题和关键词写一篇短文。",
    "correctAnswer": "",
    "explanation": "评分标准：内容完整(30分)、语法正确(25分)、词汇丰富(25分)、字数达标(20分)，共100分。",
    "score": 10,
    "audioStatus": "none",
    "imageStatus": "ready",
    "linked_courses": [
      "高级精讲 · 第2课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-03-15T08:00:00.000Z",
    "updatedAt": "2026-03-15T08:00:00.000Z"
  },
  {
    "question_uid": "Q-033",
    "type_id": "L05",
    "level": "HSK3",
    "tags": [
      "听力题",
      "单选题",
      "多题"
    ],
    "stem": "请听对话，回答以下问题。",
    "correctAnswer": "B,C",
    "explanation": "根据对话，女的去了图书馆，借了中文小说。",
    "score": 3,
    "audioStatus": "pending",
    "imageStatus": "none",
    "linked_courses": [
      "初级入门 · 第5课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-01T08:00:00.000Z",
    "updatedAt": "2026-04-01T08:00:00.000Z"
  },
  {
    "question_uid": "Q-034",
    "type_id": "L05",
    "level": "HSK4",
    "tags": [
      "听力题",
      "单选题",
      "多题"
    ],
    "stem": "请听对话，回答以下问题。",
    "correctAnswer": "C,B",
    "explanation": "根据对话，男的暑假打算去云南，因为风景美且天气舒服。",
    "score": 3,
    "audioStatus": "pending",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第7课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-01T08:00:00.000Z",
    "updatedAt": "2026-04-01T08:00:00.000Z"
  },
  {
    "question_uid": "Q-035",
    "type_id": "L06",
    "level": "HSK2",
    "tags": [
      "听力题",
      "判断题",
      "图片题"
    ],
    "stem": "请听句子，判断与图片内容是否一致。",
    "options": [
      {
        "key": "A",
        "text": "对",
        "pinyin": "duì"
      },
      {
        "key": "B",
        "text": "错",
        "pinyin": "cuò"
      }
    ],
    "correctAnswer": "B",
    "explanation": "录音说\"他在打电话\"，但图片是\"一个男人在看书\"，内容不一致，所以选\"错\"。",
    "score": 2,
    "audioStatus": "pending",
    "imageStatus": "pending",
    "linked_courses": [
      "初级入门 · 第5课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-02T08:00:00.000Z",
    "updatedAt": "2026-04-02T08:00:00.000Z"
  },
  {
    "question_uid": "Q-036",
    "type_id": "L06",
    "level": "HSK3",
    "tags": [
      "听力题",
      "判断题",
      "图片题"
    ],
    "stem": "请听句子，判断与图片内容是否一致。",
    "options": [
      {
        "key": "A",
        "text": "对",
        "pinyin": "duì"
      },
      {
        "key": "B",
        "text": "错",
        "pinyin": "cuò"
      }
    ],
    "correctAnswer": "A",
    "explanation": "录音描述桌子上有水果，与图片内容一致，选\"对\"。",
    "score": 2,
    "audioStatus": "pending",
    "imageStatus": "pending",
    "linked_courses": [
      "初级入门 · 第3课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-02T08:00:00.000Z",
    "updatedAt": "2026-04-02T08:00:00.000Z"
  },
  {
    "question_uid": "Q-037",
    "type_id": "R05",
    "level": "HSK4",
    "tags": [
      "阅读题",
      "填空题"
    ],
    "stem": "请选择合适的句子填入段落空白处。",
    "correctAnswer": "A,B",
    "explanation": "第一空选A（天气很好，阳光灿烂），与后文\"风景很美\"呼应。第二空选B（我们休息了一下），与后文\"累极了\"形成逻辑。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "高级精讲 · 第3课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-03T08:00:00.000Z",
    "updatedAt": "2026-04-03T08:00:00.000Z"
  },
  {
    "question_uid": "Q-038",
    "type_id": "R05",
    "level": "HSK5",
    "tags": [
      "阅读题",
      "填空题"
    ],
    "stem": "请选择合适的句子填入段落空白处。",
    "correctAnswer": "A,B",
    "explanation": "第一空选A（他先做早餐然后吃），与起床后的行为衔接。第二空选B（他中午在食堂吃饭），描述白天在公司的活动，与后文\"下班后\"形成时间线。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "高级精讲 · 第4课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-03T08:00:00.000Z",
    "updatedAt": "2026-04-03T08:00:00.000Z"
  },
  {
    "question_uid": "Q-039",
    "type_id": "R06",
    "level": "HSK5",
    "tags": [
      "阅读题",
      "填空题"
    ],
    "stem": "请选择合适的词语填入文章空白处。",
    "correctAnswer": "B,A,A",
    "explanation": "第一空选B（食物），因为\"民以食为天\"的意思是食物对老百姓最重要。第二空选A（特点），指各地饮食有不同特点。第三空选A（以），\"以清淡为主\"是固定搭配。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "高级精讲 · 第5课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-04T08:00:00.000Z",
    "updatedAt": "2026-04-04T08:00:00.000Z"
  },
  {
    "question_uid": "Q-040",
    "type_id": "R06",
    "level": "HSK5",
    "tags": [
      "阅读题",
      "填空题"
    ],
    "stem": "请选择合适的词语填入文章空白处。",
    "correctAnswer": "A,C,B",
    "explanation": "第一空选A（买），去超市买水果。第二空选C（等），排队等候。第三空选B（遇到），回家路上偶然遇到老朋友。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "高级精讲 · 第6课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-04T08:00:00.000Z",
    "updatedAt": "2026-04-04T08:00:00.000Z"
  },
  {
    "question_uid": "Q-041",
    "type_id": "R07",
    "level": "HSK5",
    "tags": [
      "阅读题",
      "单选题",
      "多题"
    ],
    "stem": "请阅读文章，回答以下问题。",
    "correctAnswer": "B,C",
    "explanation": "第一题：文章说不能直接看到商品是缺点而非优点。第二题：作者同时列举了优缺点，态度客观。",
    "score": 4,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "高级精讲 · 第7课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-05T08:00:00.000Z",
    "updatedAt": "2026-04-05T08:00:00.000Z"
  },
  {
    "question_uid": "Q-042",
    "type_id": "R07",
    "level": "HSK5",
    "tags": [
      "阅读题",
      "单选题",
      "多题"
    ],
    "stem": "请阅读文章，回答以下问题。",
    "correctAnswer": "B,C",
    "explanation": "第一题：文章第一段说明茶有\"几千年\"的历史。第二题：文章说明绿茶可以\"提神\"。",
    "score": 4,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "高级精讲 · 第8课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-05T08:00:00.000Z",
    "updatedAt": "2026-04-05T08:00:00.000Z"
  },
  {
    "question_uid": "Q-043",
    "type_id": "R04",
    "level": "HSK4",
    "tags": [
      "阅读题",
      "排序题"
    ],
    "stem": "请将以下句子按正确顺序排列。",
    "correctAnswer": "BCAD",
    "explanation": "正确顺序：起床B → 跑步C → 借书A → 看书D。按照一天的时间线排列。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第4课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-06T08:00:00.000Z",
    "updatedAt": "2026-04-06T08:00:00.000Z"
  },
  {
    "question_uid": "Q-044",
    "type_id": "R04",
    "level": "HSK5",
    "tags": [
      "阅读题",
      "排序题"
    ],
    "stem": "请将以下句子按正确顺序排列。",
    "correctAnswer": "BCAD",
    "explanation": "正确顺序：今天是生日B → 朋友们送礼物C → 打开礼物A → 看到礼物很开心D。",
    "score": 3,
    "audioStatus": "none",
    "imageStatus": "none",
    "linked_courses": [
      "中级进阶 · 第5课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-06T08:00:00.000Z",
    "updatedAt": "2026-04-06T08:00:00.000Z"
  },
  {
    "question_uid": "Q-045",
    "type_id": "R09",
    "level": "HSK3",
    "tags": [
      "阅读题",
      "填空题",
      "图片题",
      "词语题"
    ],
    "stem": "请根据图片选择合适的词语填入空白处。",
    "options": [
      {
        "key": "A",
        "text": "做",
        "pinyin": "zuò"
      },
      {
        "key": "B",
        "text": "吃",
        "pinyin": "chī"
      },
      {
        "key": "C",
        "text": "买",
        "pinyin": "mǎi"
      },
      {
        "key": "D",
        "text": "看",
        "pinyin": "kàn"
      }
    ],
    "correctAnswer": "B",
    "explanation": "图片显示一家人正在餐桌旁，桌上有很多菜，所以是\"吃晚饭\"。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "pending",
    "linked_courses": [
      "初级入门 · 第4课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-07T08:00:00.000Z",
    "updatedAt": "2026-04-07T08:00:00.000Z"
  },
  {
    "question_uid": "Q-046",
    "type_id": "R09",
    "level": "HSK4",
    "tags": [
      "阅读题",
      "填空题",
      "图片题",
      "词语题"
    ],
    "stem": "请根据图片选择合适的词语填入空白处。",
    "options": [
      {
        "key": "A",
        "text": "游泳",
        "pinyin": "yóu yǒng"
      },
      {
        "key": "B",
        "text": "跑步",
        "pinyin": "pǎo bù"
      },
      {
        "key": "C",
        "text": "跳高",
        "pinyin": "tiào gāo"
      },
      {
        "key": "D",
        "text": "打篮球",
        "pinyin": "dǎ lán qiú"
      }
    ],
    "correctAnswer": "B",
    "explanation": "图片显示男孩在操场上跑步流汗，所以是\"跑步\"。",
    "score": 2,
    "audioStatus": "none",
    "imageStatus": "pending",
    "linked_courses": [
      "初级入门 · 第2课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-07T08:00:00.000Z",
    "updatedAt": "2026-04-07T08:00:00.000Z"
  },
  {
    "question_uid": "Q-047",
    "type_id": "W03",
    "level": "HSK4",
    "tags": [
      "书写题",
      "造句题",
      "图片题"
    ],
    "stem": "请根据图片和关键词造一个完整的句子。",
    "correctAnswer": "",
    "explanation": "关键词：咖啡厅、看书、安静。参考答案使用\"一边...一边...\"结构连接两个动作。",
    "score": 5,
    "audioStatus": "none",
    "imageStatus": "pending",
    "linked_courses": [
      "中级进阶 · 第7课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-08T08:00:00.000Z",
    "updatedAt": "2026-04-08T08:00:00.000Z"
  },
  {
    "question_uid": "Q-048",
    "type_id": "W03",
    "level": "HSK5",
    "tags": [
      "书写题",
      "造句题",
      "图片题"
    ],
    "stem": "请根据图片和关键词造一个完整的句子。",
    "correctAnswer": "",
    "explanation": "关键词：公园、放风筝、快乐。参考答案使用了\"在...里...\"的方位结构。",
    "score": 5,
    "audioStatus": "none",
    "imageStatus": "pending",
    "linked_courses": [
      "中级进阶 · 第8课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-08T08:00:00.000Z",
    "updatedAt": "2026-04-08T08:00:00.000Z"
  },
  {
    "question_uid": "Q-049",
    "type_id": "R08",
    "level": "HSK2",
    "tags": [
      "阅读题",
      "判断题",
      "图片题"
    ],
    "stem": "请看图片和句子，判断句子描述是否与图片一致。",
    "options": [
      {
        "key": "A",
        "text": "对",
        "pinyin": "duì"
      },
      {
        "key": "B",
        "text": "错",
        "pinyin": "cuò"
      }
    ],
    "correctAnswer": "B",
    "explanation": "图片中的人在踢足球，不是打篮球，所以句子描述错误，答案为\"错\"。",
    "score": 2,
    "imageStatus": "pending",
    "linked_courses": [
      "初级入门 · 第3课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-09T08:00:00.000Z",
    "updatedAt": "2026-04-09T08:00:00.000Z"
  },
  {
    "question_uid": "Q-050",
    "type_id": "R08",
    "level": "HSK3",
    "tags": [
      "阅读题",
      "判断题",
      "图片题"
    ],
    "stem": "请看图片和句子，判断句子描述是否与图片一致。",
    "options": [
      {
        "key": "A",
        "text": "对",
        "pinyin": "duì"
      },
      {
        "key": "B",
        "text": "错",
        "pinyin": "cuò"
      }
    ],
    "correctAnswer": "A",
    "explanation": "图片中桌子上确实有三本书，与句子描述一致，答案为\"对\"。",
    "score": 2,
    "imageStatus": "pending",
    "linked_courses": [
      "初级入门 · 第5课"
    ],
    "linked_papers": [],
    "linked_videos": [],
    "status": "published",
    "createdAt": "2026-04-09T08:00:00.000Z",
    "updatedAt": "2026-04-09T08:00:00.000Z"
  }
] as HskQuestionRow[];

export function createAdminSeedQuestions(): HskQuestionRow[] {
  return HSK_ADMIN_SEED_QUESTIONS.map((row) => ({ ...row }));
}

/** 加载 store 时还原 5174 端完整 50 题样例库 */
export function ensureAdminSeedQuestions(questions: HskQuestionRow[]): HskQuestionRow[] {
  const defaults = createAdminSeedQuestions();
  if (!questions.length) return defaults;
  if (questions.length >= 50 && questions.some((q) => q.question_uid === 'Q-050')) {
    return questions;
  }
  return defaults;
}
