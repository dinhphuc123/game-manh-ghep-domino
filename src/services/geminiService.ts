import { PuzzlePair } from '../types';

export interface GeminiResponse {
  pairs: {
    answer: string;
    distractors: string[];
  }[];
}

export interface TestApiKeyResult {
  success: boolean;
  message?: string;
  fallbackModel?: string;
}

/**
 * Lấy danh sách các model Gemini hỗ trợ tạo nội dung được cấp phép cho API Key này
 */
export const getAvailableGeminiModels = async (apiKey: string): Promise<string[]> => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    if (data && Array.isArray(data.models)) {
      // Lọc ra các model hỗ trợ generateContent và lấy tên rút gọn của model
      return data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace('models/', ''));
    }
    return [];
  } catch (error) {
    console.error('Không thể lấy danh sách model Gemini từ API:', error);
    return [];
  }
};

/**
 * Tìm model thay thế tốt nhất từ danh sách khả dụng
 */
export const findBestAlternativeModel = (availableModels: string[], currentModel: string): string | null => {
  if (availableModels.length === 0) return null;
  
  // Thứ tự ưu tiên các model phổ biến
  const priorityList = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
  
  // Thử tìm theo thứ tự ưu tiên
  for (const candidate of priorityList) {
    if (candidate !== currentModel && availableModels.includes(candidate)) {
      return candidate;
    }
  }
  
  // Thử tìm model có chứa "-flash" bất kỳ khác model hiện tại
  const flashCandidate = availableModels.find(m => m !== currentModel && m.includes('-flash'));
  if (flashCandidate) return flashCandidate;
  
  // Trả về model đầu tiên khả dụng khác model hiện tại
  const firstAlt = availableModels.find(m => m !== currentModel);
  return firstAlt || null;
};

/**
 * Gọi Gemini API để sinh các phương án nhiễu thông minh.
 * @param pairs Danh sách các cặp question-answer cần tạo phương án nhiễu
 * @param apiKey API key lấy từ store hoặc biến môi trường
 * @param model Model để sinh nội dung
 * @returns Map map từ answer sang danh sách distractors
 */
export const generateAIDistractors = async (
  pairs: PuzzlePair[],
  apiKey: string,
  model: string = 'gemini-3.5-flash'
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

  const callApiWithModel = async (modelName: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${finalApiKey}`;
    return await fetch(url, {
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
  };

  try {
    let response = await callApiWithModel(model);

    // Tự động fallback sang model khả dụng khác nếu gặp lỗi (trừ lỗi xác thực 400 hoặc chặn địa lý 403)
    if (!response.ok) {
      let errMsg = '';
      try {
        const errJson = await response.json();
        errMsg = errJson.error?.message || JSON.stringify(errJson);
      } catch {
        errMsg = await response.text();
      }

      console.warn(`Gọi model ${model} thất bại:`, errMsg);

      const canFallback = response.status !== 400 && response.status !== 403;
      if (canFallback) {
        console.log('Truy vấn danh sách model khả dụng để tìm model dự phòng...');
        const availableModels = await getAvailableGeminiModels(finalApiKey);
        let fallbackModel = 'gemini-1.5-flash';
        
        if (availableModels.length > 0) {
          const alt = findBestAlternativeModel(availableModels, model);
          if (alt) fallbackModel = alt;
        }
        
        if (model !== fallbackModel) {
          console.warn(`Model ${model} gặp lỗi (Status: ${response.status}), đang tự động fallback sang ${fallbackModel}...`);
          response = await callApiWithModel(fallbackModel);
        } else {
          throw new Error(`Gemini API Error: ${errMsg} (Status: ${response.status})`);
        }
      } else {
        // Ném lỗi ban đầu nếu không thể fallback
        throw new Error(`Gemini API Error: ${errMsg} (Status: ${response.status})`);
      }
    }

    if (!response.ok) {
      let errMsg = '';
      try {
        const errJson = await response.json();
        errMsg = errJson.error?.message || JSON.stringify(errJson);
      } catch {
        errMsg = await response.text();
      }
      throw new Error(`Gemini API Error: ${errMsg} (Status: ${response.status})`);
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
 * Hàm kiểm tra nhanh API key xem có hoạt động không, trả về thông tin lỗi chi tiết và model fallback nếu có.
 */
export const testGeminiApiKey = async (
  apiKey: string,
  model: string = 'gemini-3.5-flash'
): Promise<TestApiKeyResult> => {
  const tryModel = async (modelName: string): Promise<{ ok: boolean; status: number; errMsg?: string }> => {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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

      if (response.ok) {
        return { ok: true, status: response.status };
      }

      let errMsg = '';
      try {
        const errJson = await response.json();
        errMsg = errJson.error?.message || JSON.stringify(errJson);
      } catch {
        errMsg = await response.text();
      }
      return { ok: false, status: response.status, errMsg };
    } catch (e: any) {
      return { ok: false, status: 0, errMsg: e.message || 'Lỗi mạng không thể kết nối.' };
    }
  };

  // 1. Tự động lấy danh sách các model khả dụng cho API Key trước
  console.log('Đang truy vấn danh sách model khả dụng cho API Key...');
  const availableModels = await getAvailableGeminiModels(apiKey);
  console.log('Các model khả dụng:', availableModels);

  let targetModel = model;
  let hasAutoSelected = false;

  // Nếu có danh sách khả dụng nhưng model được chọn không nằm trong danh sách
  if (availableModels.length > 0 && !availableModels.includes(model)) {
    const altModel = findBestAlternativeModel(availableModels, model);
    if (altModel) {
      console.warn(`Model ${model} không được hỗ trợ bởi Key này. Tự động chọn model thay thế: ${altModel}`);
      targetModel = altModel;
      hasAutoSelected = true;
    }
  }

  // Thử model được nhắm tới
  const result = await tryModel(targetModel);
  if (result.ok) {
    if (hasAutoSelected) {
      return {
        success: true,
        message: `Đã kết nối thành công! (Tự động chuyển sang model khả dụng cao nhất của bạn là ${targetModel} do model ${model} không được hỗ trợ)`,
        fallbackModel: targetModel
      };
    }
    return { success: true, message: `Kết nối tốt với model ${targetModel}!` };
  }

  const errorMsg = result.errMsg || '';
  console.warn(`Kiểm tra API với model ${targetModel} thất bại:`, errorMsg);

  // 2. Nếu model bị lỗi (503, 500, 429, v.v.), cố gắng thử fallback sang model khác trong danh sách khả dụng
  const canTryFallback = result.status !== 400 && result.status !== 403;
  if (canTryFallback) {
    // Tìm model dự phòng tốt nhất khác targetModel
    let fallbackCandidate = 'gemini-1.5-flash';
    if (availableModels.length > 0) {
      const alt = findBestAlternativeModel(availableModels, targetModel);
      if (alt) fallbackCandidate = alt;
    }
    
    if (targetModel !== fallbackCandidate) {
      console.log(`Đang tự động thử kết nối dự phòng sang ${fallbackCandidate} do model ${targetModel} gặp lỗi (Status: ${result.status})...`);
      const fallbackResult = await tryModel(fallbackCandidate);
      if (fallbackResult.ok) {
        return {
          success: true,
          message: `Kết nối thành công qua model dự phòng ${fallbackCandidate}! (Đã tự động chuyển đổi từ ${targetModel} do model này đang gặp sự cố hoặc quá tải: Status ${result.status})`,
          fallbackModel: fallbackCandidate
        };
      }
    }
  }

  // Dịch các lỗi phổ biến từ API sang tiếng Việt cho trực quan
  let friendlyMsg = errorMsg;
  if (errorMsg.includes('API key not valid') || errorMsg.includes('API_KEY_INVALID') || result.status === 400) {
    friendlyMsg = 'API Key không hợp lệ hoặc đã bị khóa. Vui lòng kiểm tra lại.';
  } else if (errorMsg.includes('User location is not supported') || result.status === 403) {
    friendlyMsg = 'Khu vực địa lý của bạn hiện chưa được Google Gemini hỗ trợ. Bạn nên thử cấu hình proxy/VPN hoặc đổi model.';
  } else if (result.status === 404) {
    friendlyMsg = `Không tìm thấy model ${targetModel} trên API. Có thể tài khoản của bạn chưa được kích hoạt quyền truy cập model này.`;
  } else if (result.status === 429) {
    friendlyMsg = 'Tài khoản đã vượt quá giới hạn lượt gọi API (Quota Exceeded). Vui lòng thử lại sau.';
  }

  return {
    success: false,
    message: `${friendlyMsg} (Mã lỗi: ${result.status})`
  };
};
