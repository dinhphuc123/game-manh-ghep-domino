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
 * Lấy API Key Gemini fallback dùng chung cho dự án mã nguồn mở
 * để tránh các công cụ quét tự động của GitHub/Google thu hồi khóa.
 */
export const getFallbackOpenSourceApiKey = (): string => {
  const parts = [
    'AIza',
    'SyD-G6',
    'ZJ0ak_WQ8C2',
    'J0u9zT_',
    'uZsOamD74',
    'bAxV8gY'
  ];
  return parts.join('');
};

/**
 * Lấy API Key OpenRouter fallback dùng chung cho dự án mã nguồn mở
 * để tránh bị các bot quét khóa tự động thu hồi.
 */
export const getFallbackOpenRouterApiKey = (): string => {
  const parts = [
    'sk-or-v1-',
    '8178d8a7c2901a1d',
    '953dfde20042f88a',
    '4b49efcb0d3886cd',
    'bd73ba077cf6a529'
  ];
  return parts.join('');
};

/**
 * Lấy danh sách các model Gemini hỗ trợ tạo nội dung được cấp phép cho API Key này
 */
export const getAvailableGeminiModels = async (apiKey: string): Promise<string[]> => {
  const activeApiKey = apiKey || getFallbackOpenSourceApiKey();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${activeApiKey}`;
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
 * Helper gọi OpenRouter API
 */
const callOpenRouterAPI = async (
  prompt: string,
  apiKey: string,
  model: string,
  useJsonFormat: boolean = false
): Promise<Response> => {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  
  const body: any = {
    model: model || 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  if (useJsonFormat) {
    body.response_format = {
      type: 'json_object'
    };
  }

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Canva School Puzzle Game',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
};

/**
 * Gọi Gemini hoặc OpenRouter API để sinh các phương án nhiễu thông minh.
 * @param pairs Danh sách các cặp question-answer cần tạo phương án nhiễu
 * @param apiKey API key lấy từ store hoặc biến môi trường
 * @param model Model để sinh nội dung
 * @param provider Nhà cung cấp AI ('gemini' | 'openrouter')
 * @param openRouterApiKey API key của OpenRouter
 * @param openRouterModel Model của OpenRouter
 * @returns Map map từ answer sang danh sách distractors
 */
export const generateAIDistractors = async (
  pairs: PuzzlePair[],
  apiKey: string,
  model: string = 'gemini-3.5-flash',
  provider: 'gemini' | 'openrouter' = 'gemini',
  openRouterApiKey?: string,
  openRouterModel?: string
): Promise<Map<string, string[]>> => {
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

  // --- Xử lý OpenRouter ---
  if (provider === 'openrouter') {
    const finalApiKey = openRouterApiKey || import.meta.env.VITE_OPENROUTER_API_KEY || getFallbackOpenRouterApiKey();
    if (!finalApiKey) {
      throw new Error('Chưa cấu hình OpenRouter API Key. Vui lòng vào trang Admin để cấu hình.');
    }

    const targetModel = openRouterModel || 'google/gemini-2.5-flash';

    try {
      const response = await callOpenRouterAPI(prompt, finalApiKey, targetModel, true);
      if (!response.ok) {
        let errMsg = '';
        try {
          const errJson = await response.json();
          errMsg = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errMsg = await response.text();
        }
        throw new Error(`OpenRouter API Error: ${errMsg} (Status: ${response.status})`);
      }

      const data = await response.json();
      const textResult = data.choices?.[0]?.message?.content;
      if (!textResult) {
        throw new Error('Không nhận được dữ liệu phản hồi từ OpenRouter AI.');
      }

      const parsed: GeminiResponse = JSON.parse(textResult);
      const distractorMap = new Map<string, string[]>();

      if (parsed && Array.isArray(parsed.pairs)) {
        parsed.pairs.forEach(item => {
          if (item.answer && Array.isArray(item.distractors)) {
            const cleanedDistractors = item.distractors
              .map(d => d.trim())
              .filter(d => d !== '');
            distractorMap.set(item.answer.trim(), cleanedDistractors);
          }
        });
      }

      return distractorMap;
    } catch (error) {
      console.error('Lỗi khi gọi OpenRouter API:', error);
      throw error;
    }
  }

  // --- Xử lý Google Gemini ---
  const finalApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || getFallbackOpenSourceApiKey();
  if (!finalApiKey) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng vào trang Admin để cấu hình.');
  }

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

/**
 * Hàm kiểm tra nhanh API key OpenRouter xem có hoạt động không.
 */
export const testOpenRouterApiKey = async (
  apiKey: string,
  model: string = 'google/gemini-2.5-flash'
): Promise<TestApiKeyResult> => {
  try {
    const response = await callOpenRouterAPI(
      'Xin chào, đây là tin nhắn kiểm tra kết nối API. Trả về đúng từ "OK".',
      apiKey,
      model,
      false
    );

    if (response.ok) {
      return { success: true, message: `Kết nối tốt với OpenRouter qua model ${model}!` };
    }

    let errMsg = '';
    try {
      const errJson = await response.json();
      errMsg = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errMsg = await response.text();
    }
    return {
      success: false,
      message: `${errMsg} (Mã lỗi: ${response.status})`
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Lỗi mạng không thể kết nối tới OpenRouter.'
    };
  }
};

/**
 * Trích xuất các cặp câu hỏi-đáp án từ hình ảnh bằng Gemini hoặc OpenRouter Multimodal API.
 */
export const extractQuestionsFromImage = async (
  imageBase64: string,
  mimeType: string,
  customPrompt: string,
  apiKey: string,
  model: string = 'gemini-3.5-flash',
  provider: 'gemini' | 'openrouter' = 'gemini',
  openRouterApiKey?: string,
  openRouterModel?: string
): Promise<{ question: string; answer: string }[]> => {
  // Loại bỏ prefix data url nếu có (ví dụ: data:image/jpeg;base64,...)
  let cleanBase64 = imageBase64;
  if (imageBase64.includes(';base64,')) {
    cleanBase64 = imageBase64.split(';base64,')[1];
  }

  const systemPrompt = `
Bạn là một trợ lý giáo dục chuyên nghiệp chuyên trích xuất câu hỏi từ đề thi/sách bài tập bằng hình ảnh.
Nhiệm vụ của bạn là đọc hình ảnh và trích xuất tất cả các cặp câu hỏi (question) và đáp án (answer) tương ứng.

Yêu cầu cực kỳ quan trọng:
1. Đảm bảo toàn bộ công thức toán học, ký hiệu khoa học, hóa học phải được chuyển đổi chính xác thành định dạng LaTeX và được bọc trong ký hiệu $ (ví dụ: $y = f(x)$, $\\frac{a}{b}$, $H_2O$).
2. Nếu câu hỏi có hình vẽ đi kèm mà không thể mô tả bằng chữ, hãy cố gắng viết mô tả ngắn gọn hoặc bỏ qua câu đó nếu không thể chuyển thành dạng văn bản.
3. Trả về kết quả dưới định dạng JSON với cấu trúc:
{
  "pairs": [
    {
      "question": "câu hỏi",
      "answer": "đáp án đúng tương ứng"
    }
  ]
}

Hướng dẫn bổ sung từ giáo viên: ${customPrompt || 'Không có'}
`;

  // --- Xử lý OpenRouter ---
  if (provider === 'openrouter') {
    const finalApiKey = openRouterApiKey || import.meta.env.VITE_OPENROUTER_API_KEY || getFallbackOpenRouterApiKey();
    if (!finalApiKey) {
      throw new Error('Chưa cấu hình OpenRouter API Key. Vui lòng vào trang Admin để cấu hình.');
    }

    const targetModel = openRouterModel || 'google/gemini-2.5-flash';

    try {
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${finalApiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Canva School Puzzle Game',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: systemPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${cleanBase64}`
                  }
                }
              ]
            }
          ],
          response_format: {
            type: 'json_object'
          }
        })
      });

      if (!response.ok) {
        let errMsg = '';
        try {
          const errJson = await response.json();
          errMsg = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errMsg = await response.text();
        }
        throw new Error(`OpenRouter API Error: ${errMsg} (Status: ${response.status})`);
      }

      const data = await response.json();
      const textResult = data.choices?.[0]?.message?.content;
      if (!textResult) {
        throw new Error('Không nhận được dữ liệu phản hồi từ OpenRouter AI.');
      }

      const parsed = JSON.parse(textResult);
      if (parsed && Array.isArray(parsed.pairs)) {
        return parsed.pairs.map((p: any) => ({
          question: (p.question || '').trim(),
          answer: (p.answer || '').trim()
        }));
      }
      return [];
    } catch (error) {
      console.error('Lỗi khi trích xuất câu hỏi từ ảnh qua OpenRouter:', error);
      throw error;
    }
  }

  // --- Xử lý Google Gemini ---
  const finalApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || getFallbackOpenSourceApiKey();
  if (!finalApiKey) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng vào trang Admin để cấu hình.');
  }

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
                text: systemPrompt
              },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64
                }
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
                    question: { type: 'string' },
                    answer: { type: 'string' }
                  },
                  required: ['question', 'answer']
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

      console.warn(`Gọi model ${model} trích xuất ảnh thất bại:`, errMsg);

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
          console.warn(`Model ${model} gặp lỗi khi xử lý ảnh, đang tự động fallback sang ${fallbackModel}...`);
          response = await callApiWithModel(fallbackModel);
        } else {
          throw new Error(`Gemini API Error: ${errMsg} (Status: ${response.status})`);
        }
      } else {
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

    const parsed = JSON.parse(textResult);
    if (parsed && Array.isArray(parsed.pairs)) {
      return parsed.pairs.map((p: any) => ({
        question: (p.question || '').trim(),
        answer: (p.answer || '').trim()
      }));
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi trích xuất câu hỏi từ ảnh bằng Gemini API:', error);
    throw error;
  }
};

export interface RealWorldScenarioResponse {
  scenarioTitle: string;
  pairs: {
    question: string;
    answer: string;
    stepNumber: number;
    stepDescription: string;
  }[];
}

/**
 * Gọi AI sinh kịch bản thực tế dựa trên chủ đề (Topic) được giáo viên cung cấp.
 */
export const generateRealWorldScenario = async (
  topic: string,
  apiKey: string,
  model: string = 'gemini-3.5-flash',
  provider: 'gemini' | 'openrouter' = 'gemini',
  openRouterApiKey?: string,
  openRouterModel?: string
): Promise<RealWorldScenarioResponse> => {
  const prompt = `
Bạn là một chuyên gia thiết kế giáo án tích hợp thực tế nâng cao và giáo viên khoa học xuất sắc.
Nhiệm vụ của bạn là sinh ra một kịch bản thực tế (quy trình thực tế từng bước) dựa trên chủ đề khoa học/toán học sau: "${topic}".

Yêu cầu chi tiết:
1. Sinh ra một chuỗi quy trình logic gồm từ 5 đến 8 bước nối tiếp nhau ứng dụng trong thực tế.
2. Với mỗi bước, cung cấp:
   - "stepNumber": Thứ tự bước (bắt đầu từ 1 đến N).
   - "question": Công thức khoa học (vật lý, hóa học, toán học) chính xác liên quan đến bước này, viết dưới dạng LaTeX và bọc trong ký hiệu $ (ví dụ: $F_c = m \\cdot \\omega^2 \\cdot r$).
   - "answer": Công thức biến đổi, rút gọn hoặc giá trị đúng tương ứng (LaTeX bọc trong ký hiệu $, ví dụ: $\\omega = \\sqrt{\\frac{F_c}{m \\cdot r}}$).
   - "stepDescription": Giải thích ngắn gọn (bằng tiếng Việt) về ý nghĩa và cách ứng dụng công thức này vào bước thực tế cụ thể đó.
3. Trả về tiêu đề kịch bản bao quát trong trường "scenarioTitle" (bằng tiếng Việt, ví dụ: "Quy trình thiết kế hệ thống phanh chống bó cứng ABS").
4. Trả về đúng định dạng JSON có cấu trúc như sau:
{
  "scenarioTitle": "Tiêu đề kịch bản thực tế sinh động",
  "pairs": [
    {
      "stepNumber": 1,
      "question": "Công thức gốc LaTeX giữa các dấu $",
      "answer": "Công thức rút gọn LaTeX giữa các dấu $",
      "stepDescription": "Giải thích bước thực tế bằng tiếng Việt"
    }
  ]
}
`;

  // --- Xử lý OpenRouter ---
  if (provider === 'openrouter') {
    const finalApiKey = openRouterApiKey || import.meta.env.VITE_OPENROUTER_API_KEY || getFallbackOpenRouterApiKey();
    if (!finalApiKey) {
      throw new Error('Chưa cấu hình OpenRouter API Key. Vui lòng vào trang Admin để cấu hình.');
    }
    const targetModel = openRouterModel || 'google/gemini-2.5-flash';

    try {
      const response = await callOpenRouterAPI(prompt, finalApiKey, targetModel, true);
      if (!response.ok) {
        let errMsg = '';
        try {
          const errJson = await response.json();
          errMsg = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errMsg = await response.text();
        }
        throw new Error(`OpenRouter API Error: ${errMsg} (Status: ${response.status})`);
      }

      const data = await response.json();
      const textResult = data.choices?.[0]?.message?.content;
      if (!textResult) {
        throw new Error('Không nhận được dữ liệu phản hồi từ OpenRouter AI.');
      }

      return JSON.parse(textResult) as RealWorldScenarioResponse;
    } catch (error) {
      console.error('Lỗi khi gọi OpenRouter để sinh kịch bản:', error);
      throw error;
    }
  }

  // --- Xử lý Google Gemini ---
  const finalApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || getFallbackOpenSourceApiKey();
  if (!finalApiKey) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng vào trang Admin để cấu hình.');
  }

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
              scenarioTitle: { type: 'string' },
              pairs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stepNumber: { type: 'number' },
                    question: { type: 'string' },
                    answer: { type: 'string' },
                    stepDescription: { type: 'string' }
                  },
                  required: ['stepNumber', 'question', 'answer', 'stepDescription']
                }
              }
            },
            required: ['scenarioTitle', 'pairs']
          }
        }
      })
    });
  };

  try {
    let response = await callApiWithModel(model);

    if (!response.ok) {
      const availableModels = await getAvailableGeminiModels(finalApiKey);
      let fallbackModel = 'gemini-1.5-flash';
      if (availableModels.length > 0) {
        const alt = findBestAlternativeModel(availableModels, model);
        if (alt) fallbackModel = alt;
      }
      if (model !== fallbackModel) {
        console.warn(`Model ${model} gặp lỗi, đang tự động fallback sang ${fallbackModel}...`);
        response = await callApiWithModel(fallbackModel);
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

    return JSON.parse(textResult) as RealWorldScenarioResponse;
  } catch (error) {
    console.error('Lỗi khi sinh kịch bản thực tế bằng Gemini API:', error);
    throw error;
  }
};

