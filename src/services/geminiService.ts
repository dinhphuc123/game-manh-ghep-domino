import { PuzzlePair } from '../types';

export interface GeminiResponse {
  pairs: {
    answer: string;
    distractors: string[];
  }[];
}

/**
 * Gọi Gemini API để sinh các phương án nhiễu thông minh.
 * @param pairs Danh sách các cặp question-answer cần tạo phương án nhiễu
 * @param apiKey API key lấy từ store hoặc biến môi trường
 * @returns Map map từ answer sang danh sách distractors
 */
export const generateAIDistractors = async (
  pairs: PuzzlePair[],
  apiKey: string
): Promise<Map<string, string[]>> => {
  const finalApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!finalApiKey) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng vào trang Admin để cấu hình.');
  }

  // Chuẩn bị payload câu hỏi và đáp án để gửi cho AI
  const promptData = pairs.map(p => ({
    question: p.question,
    answer: p.answer
  }));

  const prompt = `
Bạn là một trợ lý giáo dục chuyên nghiệp và chuyên gia thiết kế câu hỏi trắc nghiệm toán học/khoa học/xã hội.
Nhiệm vụ của bạn là tạo ra chính xác 3 phương án nhiễu (đáp án sai) cho mỗi cặp câu hỏi và đáp án đúng dưới đây.

Yêu cầu cực kỳ quan trọng cho các phương án nhiễu:
1. Phải rất HỢP LÝ và DỄ GÂY NHẦM LẪN (ví dụ: mô phỏng lỗi tính toán sai phổ biến, nhầm lẫn công thức, nhầm dấu cộng/trừ, nhầm lẫn khái niệm tương tự).
2. Nếu đáp án đúng sử dụng LaTeX hoặc có các ký hiệu toán học (như $, \\frac, ^, _, \\sqrt, v.v.), các phương án nhiễu CŨNG PHẢI sử dụng LaTeX với định dạng tương tự để học sinh không thể nhận ra đáp án đúng chỉ dựa vào định dạng.
3. Không được trùng lặp với đáp án đúng và các phương án nhiễu phải khác nhau.
4. Trả về đúng 3 phương án nhiễu cho mỗi câu hỏi.

Dưới đây là danh sách các cặp câu hỏi và đáp án cần xử lý:
${JSON.stringify(promptData, null, 2)}

Trả về kết quả dưới định dạng JSON với cấu trúc:
{
  "pairs": [
    {
      "answer": "đáp án đúng ban đầu",
      "distractors": ["phương án nhiễu 1", "phương án nhiễu 2", "phương án nhiễu 3"]
    }
  ]
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${finalApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              pairs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    answer: { type: 'string' },
                    distractors: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  },
                  required: ['answer', 'distractors']
                }
              }
            },
            required: ['pairs']
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error('Không nhận được dữ liệu phản hồi từ Gemini AI.');
    }

    const parsed: GeminiResponse = JSON.parse(textResult);
    const distractorMap = new Map<string, string[]>();

    if (parsed && Array.isArray(parsed.pairs)) {
      parsed.pairs.forEach(item => {
        if (item.answer && Array.isArray(item.distractors)) {
          // Lọc ra các distractor hợp lệ, không rỗng và trim khoảng trắng
          const cleanedDistractors = item.distractors
            .map(d => d.trim())
            .filter(d => d !== '');
          distractorMap.set(item.answer.trim(), cleanedDistractors);
        }
      });
    }

    return distractorMap;
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    throw error;
  }
};

/**
 * Hàm kiểm tra nhanh API key xem có hoạt động không
 */
export const testGeminiApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Xin chào, đây là tin nhắn kiểm tra kết nối API. Trả về đúng từ "OK".'
              }
            ]
          }
        ]
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Kiểm tra Gemini API Key thất bại:', error);
    return false;
  }
};
